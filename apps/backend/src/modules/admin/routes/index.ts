import { FastifyInstance } from "fastify";

export default async function adminRoutes(fastify: FastifyInstance) {
    const { requireAdmin } = fastify.authHooks;

    fastify.get('/activity-logs/leaderboard', { preHandler: [requireAdmin] }, async (request) => {
        const { activityLogs } = await import('../../localization/schema');
        const { users } = await import('../../users/schema');
        const { desc, eq, sql, inArray, and, gte } = await import('drizzle-orm');

        const query = request.query as { timeframe?: string };
        const timeframe = query.timeframe || '30d';

        let fromDate = new Date(0);
        const now = new Date();
        if (timeframe === 'today') {
            fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (timeframe === '7d') {
            fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeframe === '14d') {
            fromDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        } else if (timeframe === '30d') {
            fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (timeframe === '60d') {
            fromDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        } else if (timeframe === '90d') {
            fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        } else if (timeframe === '180d') {
            fromDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        } else if (timeframe === 'year') {
            fromDate = new Date(now.getFullYear(), 0, 1);
        }

        const dateStr = fromDate.toISOString().replace('T', ' ').slice(0, 19);

        const allUsers = await fastify.db.select({
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl
        }).from(users);

        const logsQuery = fastify.db.select({
            userId: activityLogs.userId,
            details: activityLogs.details,
            action: activityLogs.action
        })
        .from(activityLogs);
        
        let logs;
        if (timeframe !== 'all') {
            logs = await logsQuery.where(gte(activityLogs.createdAt, dateStr));
        } else {
            logs = await logsQuery;
        }
        
        const userStats = allUsers.map(u => ({
            id: u.id,
            username: u.username,
            avatarUrl: u.avatarUrl,
            translationsUpdated: 0,
            keysCreated: 0,
            labelsCreated: 0,
            languagesAdded: 0,
            totalActivity: 0,
            topLanguages: [] as { code: string, count: number }[]
        }));

        const userMap = new Map(userStats.map(u => [u.id, u]));
        const langCounts = new Map<number, Map<string, number>>();

        for (const log of logs) {
            if (!log.userId) continue;
            const stats = userMap.get(log.userId);
            if (!stats) continue;

            stats.totalActivity++;

            if (log.action === 'TRANSLATION_UPDATED') {
                stats.translationsUpdated++;
                try {
                    const details = JSON.parse(log.details);
                    if (details.languageCode) {
                        if (!langCounts.has(log.userId)) langCounts.set(log.userId, new Map());
                        const userLangs = langCounts.get(log.userId)!;
                        userLangs.set(details.languageCode, (userLangs.get(details.languageCode) || 0) + 1);
                    }
                } catch (e) {}
            } else if (log.action === 'KEY_CREATED') {
                stats.keysCreated++;
            } else if (log.action === 'LABEL_CREATED') {
                stats.labelsCreated++;
            } else if (log.action === 'LANGUAGE_ADDED') {
                stats.languagesAdded++;
            }
        }

        for (const stats of userStats) {
            const langs = langCounts.get(stats.id);
            if (langs) {
                stats.topLanguages = Array.from(langs.entries())
                    .map(([code, count]) => ({ code, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3);
            }
        }

        userStats.sort((a, b) => b.totalActivity - a.totalActivity);

        return { data: userStats };
    });

    fastify.get('/activity-logs', { preHandler: [requireAdmin] }, async (request) => {
        const { activityLogs } = await import('../../localization/schema');
        const { projects } = await import('../../localization/schema');
        const { users } = await import('../../users/schema');
        const { desc, eq, sql, or, like } = await import('drizzle-orm');

        const query = request.query as { page?: string, limit?: string, search?: string };
        const page = parseInt(query.page || '1', 10);
        const limit = parseInt(query.limit || '50', 10);
        const offset = (page - 1) * limit;
        const searchTerm = query.search ? `%${query.search.toLowerCase()}%` : null;
        
        const conditions = searchTerm ? or(
            like(sql`lower(${activityLogs.action})`, searchTerm),
            like(sql`lower(${activityLogs.details})`, searchTerm)
        ) : undefined;

        const [totalResult] = await fastify.db.select({ count: sql<number>`count(*)` })
            .from(activityLogs)
            .where(conditions);
        const total = Number(totalResult?.count || 0);

        const logs = await fastify.db.select({
            id: activityLogs.id,
            action: activityLogs.action,
            details: activityLogs.details,
            createdAt: activityLogs.createdAt,
            username: users.username,
            avatarUrl: users.avatarUrl,
            projectName: projects.name
        })
        .from(activityLogs)
        .leftJoin(users, eq(activityLogs.userId, users.id))
        .leftJoin(projects, eq(activityLogs.projectId, projects.id))
        .where(conditions)
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit)
        .offset(offset);
        
        return {
            data: logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    });
}
