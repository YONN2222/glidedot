import { FastifyInstance } from 'fastify';
import { translationKeys, translations, keysToLabels, projects, languages, labels } from '../../schema';
import { eq, and, inArray } from 'drizzle-orm';
import { DeeplService } from '../../services/deepl.service';
import { GoogleService } from '../../services/google.service';

export class KeyService {
    private deeplService: DeeplService;
    private googleService: GoogleService;

    constructor(private db: FastifyInstance['db']) {
        this.deeplService = new DeeplService();
        this.googleService = new GoogleService();
    }

    async getByProject(projectId: number) {
        const keys = await this.db.select().from(translationKeys).where(eq(translationKeys.projectId, projectId));
        const keyIds = keys.map(k => k.id);

        if (keyIds.length === 0) return [];

        const { users } = await import('../../../users/schema');
        const allTranslations = await this.db.select({
            id: translations.id,
            keyId: translations.keyId,
            languageId: translations.languageId,
            value: translations.value,
            draftValue: translations.draftValue,
            reviewStatus: translations.reviewStatus,
            authorId: translations.authorId,
            authorName: users.username,
            authorAvatar: users.avatarUrl
        })
        .from(translations)
        .leftJoin(users, eq(translations.authorId, users.id))
        .where(inArray(translations.keyId, keyIds));
        
        const allLabels = await this.db.select({
            keyId: keysToLabels.keyId,
            id: labels.id,
            name: labels.name,
            color: labels.color
        })
        .from(keysToLabels)
        .innerJoin(labels, eq(keysToLabels.labelId, labels.id))
        .where(inArray(keysToLabels.keyId, keyIds));

        return keys.map(k => ({
            ...k,
            translations: allTranslations.filter(t => t.keyId === k.id),
            labels: allLabels.filter(l => l.keyId === k.id).map(l => ({ id: l.id, name: l.name, color: l.color }))
        }));
    }

    async createKey(projectId: number, key: string, labelIds?: number[]) {
        const [newKey] = await this.db.insert(translationKeys).values({ projectId, key }).returning();

        if (labelIds?.length) {
            await this.db.insert(keysToLabels).values(
                labelIds.map(labelId => ({ keyId: newKey.id, labelId }))
            );
        }

        return newKey;
    }

    async updateKey(projectId: number, keyId: number, newKeyName: string) {
        return this.db.update(translationKeys)
            .set({ key: newKeyName })
            .where(and(eq(translationKeys.id, keyId), eq(translationKeys.projectId, projectId)))
            .returning();
    }

    async deleteKey(projectId: number, keyId: number) {
        // delete translations and label links first
        await this.db.delete(translations).where(eq(translations.keyId, keyId));
        await this.db.delete(keysToLabels).where(eq(keysToLabels.keyId, keyId));
        return this.db.delete(translationKeys).where(and(eq(translationKeys.id, keyId), eq(translationKeys.projectId, projectId))).returning();
    }

    async bulkDeleteKeys(projectId: number, keyIds: number[]) {
        if (!keyIds.length) return;
        await this.db.delete(translations).where(inArray(translations.keyId, keyIds));
        await this.db.delete(keysToLabels).where(inArray(keysToLabels.keyId, keyIds));
        return this.db.delete(translationKeys).where(and(inArray(translationKeys.id, keyIds), eq(translationKeys.projectId, projectId))).returning();
    }

    async addLabelToKey(projectId: number, keyId: number, labelId: number) {
        // verify key belongs to project
        const [key] = await this.db.select().from(translationKeys).where(and(eq(translationKeys.id, keyId), eq(translationKeys.projectId, projectId)));
        if (!key) throw new Error('Key not found in project');
        return this.db.insert(keysToLabels).values({ keyId, labelId }).onConflictDoNothing().returning();
    }

    async bulkAddLabelToKeys(projectId: number, keyIds: number[], labelId: number) {
        if (!keyIds.length) return;
        const validKeys = await this.db.select({ id: translationKeys.id }).from(translationKeys).where(and(inArray(translationKeys.id, keyIds), eq(translationKeys.projectId, projectId)));
        const validKeyIds = validKeys.map(k => k.id);
        if (!validKeyIds.length) return;
        return this.db.insert(keysToLabels).values(validKeyIds.map(keyId => ({ keyId, labelId }))).onConflictDoNothing().returning();
    }

    async removeLabelFromKey(projectId: number, keyId: number, labelId: number) {
        const [key] = await this.db.select().from(translationKeys).where(and(eq(translationKeys.id, keyId), eq(translationKeys.projectId, projectId)));
        if (!key) throw new Error('Key not found in project');
        return this.db.delete(keysToLabels).where(and(eq(keysToLabels.keyId, keyId), eq(keysToLabels.labelId, labelId))).returning();
    }

    async bulkRemoveLabelFromKeys(projectId: number, keyIds: number[], labelId: number) {
        if (!keyIds.length) return;
        const validKeys = await this.db.select({ id: translationKeys.id }).from(translationKeys).where(and(inArray(translationKeys.id, keyIds), eq(translationKeys.projectId, projectId)));
        const validKeyIds = validKeys.map(k => k.id);
        if (!validKeyIds.length) return;
        return this.db.delete(keysToLabels).where(and(inArray(keysToLabels.keyId, validKeyIds), eq(keysToLabels.labelId, labelId))).returning();
    }

    async upsertTranslation(projectId: number, keyId: number, languageId: number, value: string, userId: number) {
        const { users } = await import('../../../users/schema');
        const { projects, translations } = await import('../../schema');
        const [user] = await this.db.select().from(users).where(eq(users.id, userId));
        const [project] = await this.db.select().from(projects).where(eq(projects.id, projectId));
        
        const needsReview = !user?.isAdmin && !user?.isReviewer && (project?.reviewEnabled || user?.requiresReview);

        const [existing] = await this.db.select().from(translations).where(and(eq(translations.keyId, keyId), eq(translations.languageId, languageId)));
        
        if (needsReview) {
            if (existing) {
                return this.db.update(translations)
                    .set({ draftValue: value, reviewStatus: 'PENDING_REVIEW', authorId: userId })
                    .where(eq(translations.id, existing.id))
                    .returning();
            } else {
                return this.db.insert(translations)
                    .values({ keyId, languageId, value: '', draftValue: value, reviewStatus: 'PENDING_REVIEW', authorId: userId })
                    .returning();
            }
        } else {
            return this.db.insert(translations)
                .values({ keyId, languageId, value, draftValue: null, reviewStatus: 'APPROVED', authorId: userId })
                .onConflictDoUpdate({
                    target: [translations.keyId, translations.languageId],
                    set: { value, draftValue: null, reviewStatus: 'APPROVED', authorId: userId }
                })
                .returning();
        }
    }

    async checkAndDecrementQuota(userId?: number, count: number = 1): Promise<number | null> {
        if (!userId) return null;
        const { users } = await import('../../../users/schema');
        const [user] = await this.db.select().from(users).where(eq(users.id, userId));
        if (!user) return null;
        if (!user.allowSuggestions) throw new Error('Translation suggestions are disabled for this user');
        
        if (user.isAdmin) {
            return user.translationQuota; // Unlimited, so we don't decrement
        }

        let currentQuota = user.translationQuota;
        let updateNextResetAt = user.quotaNextResetAt;

        if (user.quotaResetPeriodValue && user.quotaResetPeriodUnit && user.quotaNextResetAt) {
            if (new Date() >= user.quotaNextResetAt) {
                currentQuota = user.baseTranslationQuota;
                
                const nextReset = new Date(user.quotaNextResetAt);
                while (nextReset <= new Date()) {
                    if (user.quotaResetPeriodUnit === 'days') nextReset.setDate(nextReset.getDate() + user.quotaResetPeriodValue);
                    else if (user.quotaResetPeriodUnit === 'weeks') nextReset.setDate(nextReset.getDate() + user.quotaResetPeriodValue * 7);
                    else if (user.quotaResetPeriodUnit === 'months') nextReset.setMonth(nextReset.getMonth() + user.quotaResetPeriodValue);
                    else break;
                }
                updateNextResetAt = nextReset;
            }
        }

        if (currentQuota < count) throw new Error('Translation quota exceeded');
        
        await this.db.update(users)
            .set({ 
                translationQuota: currentQuota - count,
                quotaNextResetAt: updateNextResetAt
            })
            .where(eq(users.id, userId));
            
        return currentQuota - count;
    }

    async autoTranslate(projectId: number, keyId: number, targetLanguageIds: number[], provider: 'deepl' | 'google' = 'google', userId?: number) {
        const [project] = await this.db.select().from(projects).where(eq(projects.id, projectId));
        if (!project || !project.sourceLanguageId) throw new Error('Project or source language not found');

        const [sourceTranslation] = await this.db.select()
            .from(translations)
            .where(and(eq(translations.keyId, keyId), eq(translations.languageId, project.sourceLanguageId)));

        if (!sourceTranslation) throw new Error('Source translation not found');

        const sourceLang = await this.db.select().from(languages).where(eq(languages.id, project.sourceLanguageId));
        const targetLangs = await this.db.select().from(languages).where(inArray(languages.id, targetLanguageIds));

        await this.checkAndDecrementQuota(userId, targetLangs.length);

        const translationService = provider === 'deepl' ? this.deeplService : this.googleService;

        for (const targetLang of targetLangs) {
            const [translatedText] = await translationService.translate(
                [sourceTranslation.value],
                targetLang.code,
                sourceLang[0].code
            );
            await this.upsertTranslation(projectId, keyId, targetLang.id, translatedText, userId!);
        }
    }

    async suggestTranslation(projectId: number, keyId: number, targetLanguageId: number, provider: 'deepl' | 'google' = 'google', userId?: number) {
        const [project] = await this.db.select().from(projects).where(eq(projects.id, projectId));
        if (!project || !project.sourceLanguageId) throw new Error('Project or source language not found');

        const [sourceTranslation] = await this.db.select()
            .from(translations)
            .where(and(eq(translations.keyId, keyId), eq(translations.languageId, project.sourceLanguageId)));

        if (!sourceTranslation) throw new Error('Source translation not found');

        const sourceLang = await this.db.select().from(languages).where(eq(languages.id, project.sourceLanguageId));
        const targetLang = await this.db.select().from(languages).where(eq(languages.id, targetLanguageId));

        if (!targetLang.length) throw new Error('Target language not found');

        const quotaRemaining = await this.checkAndDecrementQuota(userId, 1);

        const translationService = provider === 'deepl' ? this.deeplService : this.googleService;

        const [translatedText] = await translationService.translate(
            [sourceTranslation.value],
            targetLang[0].code,
            sourceLang[0].code
        );

        return { suggestion: translatedText, quotaRemaining };
    }

    async logActivity(userId: number, projectId: number, action: string, details: string) {
        const { activityLogs } = await import('../../schema');
        return this.db.insert(activityLogs).values({ userId, projectId, action, details }).execute();
    }
}
