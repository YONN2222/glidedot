import { FastifyPluginAsync } from 'fastify';
import AdmZip from 'adm-zip';
import { S3BackupService } from './s3-backup.service';

import { 
    projects, languages, projectLanguages, labels, 
    translationKeys, translations, keysToLabels, activityLogs
} from '../localization/schema';

// Helper function to insert in chunks to avoid SQLite 'too many SQL variables' error
async function insertInChunks(tx: any, table: any, data: any[], chunkSize: number = 500) {
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await tx.insert(table).values(chunk);
    }
}

const migrationModule: FastifyPluginAsync = async (fastify, opts) => {
    fastify.get('/backup', async (request, reply) => {
        try {
            const allProjects = await fastify.db.select().from(projects);
            const allLanguages = await fastify.db.select().from(languages);
            const allProjectLanguages = await fastify.db.select().from(projectLanguages);
            const allLabels = await fastify.db.select().from(labels);
            const allTranslationKeys = await fastify.db.select().from(translationKeys);
            const allTranslations = await fastify.db.select().from(translations);
            const allKeysToLabels = await fastify.db.select().from(keysToLabels);

            const backupData = {
                projects: allProjects,
                languages: allLanguages,
                projectLanguages: allProjectLanguages,
                labels: allLabels,
                translationKeys: allTranslationKeys,
                translations: allTranslations,
                keysToLabels: allKeysToLabels,
            };

            const zip = new AdmZip();
            zip.addFile("backup.json", Buffer.from(JSON.stringify(backupData, null, 2), "utf8"));
            
            const zipBuffer = zip.toBuffer();

            reply.header('Content-Type', 'application/zip');
            reply.header('Content-Disposition', 'attachment; filename=glide-backup.zip');
            return zipBuffer;
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to generate backup' });
        }
    });

    fastify.post('/backup', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }

            const buffer = await data.toBuffer();
            const zip = new AdmZip(buffer);
            const zipEntries = zip.getEntries();
            
            const backupEntry = zipEntries.find((entry: any) => entry.entryName === 'backup.json');
            if (!backupEntry) {
                return reply.status(400).send({ error: 'Invalid backup file: backup.json not found' });
            }

            const backupDataStr = backupEntry.getData().toString('utf8');
            const backupData = JSON.parse(backupDataStr);

            // Import data
            await fastify.db.transaction(async (tx) => {
                // Delete everything safely
                await tx.delete(keysToLabels);
                await tx.delete(translations);
                await tx.delete(translationKeys);
                await tx.delete(labels);
                await tx.delete(projectLanguages);
                await tx.delete(projects);
                await tx.delete(languages);

                // Re-insert
                if (backupData.languages && backupData.languages.length > 0) {
                    await insertInChunks(tx, languages, backupData.languages);
                }
                if (backupData.projects && backupData.projects.length > 0) {
                    await insertInChunks(tx, projects, backupData.projects);
                }
                if (backupData.projectLanguages && backupData.projectLanguages.length > 0) {
                    await insertInChunks(tx, projectLanguages, backupData.projectLanguages);
                }
                if (backupData.labels && backupData.labels.length > 0) {
                    await insertInChunks(tx, labels, backupData.labels);
                }
                if (backupData.translationKeys && backupData.translationKeys.length > 0) {
                    await insertInChunks(tx, translationKeys, backupData.translationKeys);
                }
                if (backupData.translations && backupData.translations.length > 0) {
                    await insertInChunks(tx, translations, backupData.translations);
                }
                if (backupData.keysToLabels && backupData.keysToLabels.length > 0) {
                    await insertInChunks(tx, keysToLabels, backupData.keysToLabels);
                }
            });

            return reply.send({ success: true, message: 'Backup restored successfully' });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to restore backup' });
        }
    });

    fastify.post('/s3-backup/trigger', async (request, reply) => {
        try {
            const s3BackupService = new S3BackupService(fastify.db);
            await s3BackupService.performBackup();
            return reply.send({ success: true, message: 'S3 Backup triggered successfully' });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to trigger S3 backup' });
        }
    });
};

export default migrationModule;
