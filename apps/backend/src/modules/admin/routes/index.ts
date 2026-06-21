import { FastifyInstance } from "fastify";

export default async function adminRoutes(fastify: FastifyInstance) {
    const { requireAdmin } = fastify.authHooks;

    fastify.get('/activity-logs', { preHandler: [requireAdmin] }, async (request) => {
        const { activityLogs } = await import('../../localization/schema');
        const { projects } = await import('../../localization/schema');
        const { users } = await import('../../auth/schema');
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
