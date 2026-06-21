import { FastifyInstance } from 'fastify';
import { projects, projectLanguages, languages, translations, translationKeys, activityLogs } from '../../schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { teamMembers, teamProjects, users, teams } from '../../../auth/schema';

export class ProjectService {
    constructor(private db: FastifyInstance['db']) {}

    async getAll(user?: { id: number; isAdmin: boolean }) {
        if (!user || user.isAdmin) {
            return this.db.select().from(projects);
        }

        // Fetch user's OIDC groups
        const [userRec] = await this.db.select().from(users).where(eq(users.id, user.id));
        const oidcGroupsStr = userRec?.oidcGroups;
        const oidcGroupsArr: string[] = oidcGroupsStr ? JSON.parse(oidcGroupsStr) : [];

        const userProjects = await this.db.select({
            id: projects.id,
            name: projects.name,
            sourceLanguageId: projects.sourceLanguageId
        })
        .from(projects)
        .innerJoin(teamProjects, eq(projects.id, teamProjects.projectId))
        .innerJoin(teamMembers, eq(teamProjects.teamId, teamMembers.teamId))
        .where(eq(teamMembers.userId, user.id))
        .groupBy(projects.id);

        let oidcLinkedProjects: any[] = [];
        if (oidcGroupsArr.length > 0) {
            const { inArray } = await import('drizzle-orm');
            
            // First find teams matching the user's OIDC groups (case insensitive)
            const allTeams = await this.db.select().from(teams);
            const matchedTeamIds = allTeams
                .filter(t => {
                    if (!t.oidcMappedGroups) return false;
                    try {
                        const mappedGroups: string[] = JSON.parse(t.oidcMappedGroups).map((g: string) => g.toLowerCase());
                        return oidcGroupsArr.some(g => mappedGroups.includes(g.toLowerCase()));
                    } catch (e) {
                        return false;
                    }
                })
                .map(t => t.id);

            if (matchedTeamIds.length > 0) {
                oidcLinkedProjects = await this.db.select({
                    id: projects.id,
                    name: projects.name,
                    sourceLanguageId: projects.sourceLanguageId
                })
                .from(projects)
                .innerJoin(teamProjects, eq(projects.id, teamProjects.projectId))
                .where(inArray(teamProjects.teamId, matchedTeamIds))
                .groupBy(projects.id);
            }
        }

        // Combine and deduplicate
        const allAccessible = [...userProjects];
        for (const op of oidcLinkedProjects) {
            if (!allAccessible.some(p => p.id === op.id)) {
                allAccessible.push(op);
            }
        }

        return allAccessible;
    }

    async create(data: { name: string; sourceLanguageId?: number }) {
        return this.db.insert(projects).values(data).returning();
    }

    async update(id: number, data: { name?: string; sourceLanguageId?: number; reviewEnabled?: boolean }) {
        return this.db.update(projects).set(data).where(eq(projects.id, id)).returning();
    }

    async delete(id: number) {
        return this.db.delete(projects).where(eq(projects.id, id));
    }

    async addLanguage(projectId: number, languageId: number) {
        return this.db.insert(projectLanguages).values({ projectId, languageId }).returning();
    }

    async setSourceLanguage(projectId: number, languageId: number) {
        return this.db.update(projects).set({ sourceLanguageId: languageId }).where(eq(projects.id, projectId)).returning();
    }

    async removeLanguage(projectId: number, languageId: number) {
        return this.db.delete(projectLanguages)
            .where(and(eq(projectLanguages.projectId, projectId), eq(projectLanguages.languageId, languageId)));
    }

    async bulkRemoveLanguages(projectId: number, languageIds: number[]) {
        if (!languageIds.length) return;
        const { inArray } = await import('drizzle-orm');
        return this.db.delete(projectLanguages)
            .where(and(eq(projectLanguages.projectId, projectId), inArray(projectLanguages.languageId, languageIds)));
    }

    async getProjectLanguages(projectId: number) {
        const [project] = await this.db.select().from(projects).where(eq(projects.id, projectId));
        if (!project) throw new Error('Project not found');

        const projectLangs = await this.db.select({
            id: languages.id,
            code: languages.code,
            name: languages.name,
            flag: languages.flag
        })
        .from(projectLanguages)
        .innerJoin(languages, eq(projectLanguages.languageId, languages.id))
        .where(eq(projectLanguages.projectId, projectId));

        return projectLangs.map(l => ({
            ...l,
            isSource: l.id === project.sourceLanguageId
        }));
    }

    async exportTranslations(projectId: number, languageId: number) {
        const keys = await this.db.select().from(translationKeys).where(eq(translationKeys.projectId, projectId));
        const keyIds = keys.map(k => k.id);
        if (keyIds.length === 0) return {};

        const allTranslations = await this.db.select()
            .from(translations)
            .where(and(inArray(translations.keyId, keyIds), eq(translations.languageId, languageId)));

        const result: Record<string, string> = {};
        for (const key of keys) {
            const t = allTranslations.find(tr => tr.keyId === key.id);
            if (t) {
                result[key.key] = t.value;
            }
        }
        return result;
    }

    async importTranslations(projectId: number, languageId: number, data: Record<string, string>) {
        const existingKeys = await this.db.select().from(translationKeys).where(eq(translationKeys.projectId, projectId));
        const keyMap = new Map(existingKeys.map(k => [k.key, k.id]));

        for (const [keyName, value] of Object.entries(data)) {
            if (typeof value !== 'string') continue;
            let keyId = keyMap.get(keyName);
            if (!keyId) {
                const [newKey] = await this.db.insert(translationKeys).values({ projectId, key: keyName }).returning();
                keyId = newKey.id;
                keyMap.set(keyName, keyId);
            }
            
            await this.db.insert(translations)
                .values({ keyId, languageId, value })
                .onConflictDoUpdate({
                    target: [translations.keyId, translations.languageId],
                    set: { value }
                });
        }
        return { success: true, imported: Object.keys(data).length };
    }

    async getDashboardStats(user: { id: number; isAdmin: boolean }) {
        const accessibleProjects = await this.getAll(user);
        if (!accessibleProjects.length) {
            return { globalStats: { totalProjects: 0, totalKeys: 0, totalLanguages: 0, totalTranslations: 0, overallProgress: 0 }, projects: [] };
        }

        const projectIds = accessibleProjects.map(p => p.id);
        
        const keys = await this.db.select().from(translationKeys).where(inArray(translationKeys.projectId, projectIds));
        const totalKeys = keys.length;

        const projLangs = await this.db.select().from(projectLanguages).where(inArray(projectLanguages.projectId, projectIds));
        const totalProjectLanguages = projLangs.length;
        
        const distinctLanguageIds = new Set(projLangs.map(pl => pl.languageId));
        const totalLanguages = distinctLanguageIds.size;

        const keyIds = keys.map(k => k.id);
        let totalTranslations = 0;
        let transRecs: any[] = [];
        if (keyIds.length > 0) {
            transRecs = await this.db.select().from(translations).where(inArray(translations.keyId, keyIds));
            totalTranslations = transRecs.filter(t => t.value.trim() !== '').length;
        }

        let expectedTranslations = 0;
        
        const projectStats = accessibleProjects.map(p => {
            const pKeys = keys.filter(k => k.projectId === p.id);
            const pLangs = projLangs.filter(pl => pl.projectId === p.id);
            const expected = pKeys.length * pLangs.length;
            expectedTranslations += expected;
            
            const pKeyIds = new Set(pKeys.map(k => k.id));
            const pTrans = transRecs.filter(t => pKeyIds.has(t.keyId) && t.value.trim() !== '');
            const progress = expected === 0 ? 0 : Math.floor((pTrans.length / expected) * 100);
            
            return {
                id: p.id,
                name: p.name,
                keysCount: pKeys.length,
                languagesCount: pLangs.length,
                translationsCount: pTrans.length,
                progress
            };
        });

        const overallProgress = expectedTranslations === 0 ? 0 : Math.floor((totalTranslations / expectedTranslations) * 100);

        // Fetch personal stats for the current user
        const personalLogs = await this.db.select({ action: activityLogs.action }).from(activityLogs).where(eq(activityLogs.userId, user.id));
        const personalStats = {
            keysCreated: personalLogs.filter(l => l.action === 'KEY_CREATED').length,
            translationsUpdated: personalLogs.filter(l => l.action === 'TRANSLATION_UPDATED').length,
            languagesAdded: personalLogs.filter(l => l.action === 'LANGUAGE_ADDED').length,
            labelsCreated: personalLogs.filter(l => l.action === 'LABEL_CREATED').length,
        };

        return {
            globalStats: {
                totalProjects: accessibleProjects.length,
                totalKeys,
                totalLanguages,
                totalTranslations,
                overallProgress
            },
            projects: projectStats,
            personalStats
        };
    }
}
