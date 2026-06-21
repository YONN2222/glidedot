import { FastifyInstance } from 'fastify';
import { ProjectService } from '../services/project.service';

export default async function projectRoutes(fastify: FastifyInstance) {
    const service = new ProjectService(fastify.db);
    const { checkProjectAccess, requireAdmin } = fastify.authHooks;

    fastify.get('/', async (request) => {
        return service.getAll(request.user!);
    });

    fastify.get('/dashboard', async (request) => {
        return service.getDashboardStats(request.user!);
    });

    fastify.post('/', { preHandler: [requireAdmin] }, async (request, reply) => {
        const body = request.body as { name: string; sourceLanguageId?: number };
        const result = await service.create(body);
        const newProject = result[0];
        
        if (request.user && newProject) {
            const { activityLogs } = await import('../../schema');
            await fastify.db.insert(activityLogs).values({
                userId: request.user.id,
                projectId: newProject.id,
                action: 'PROJECT_CREATED',
                details: JSON.stringify({ name: body.name })
            }).execute();
        }
        
        reply.status(201).send(newProject);
    });

    fastify.patch('/:projectId', { preHandler: [requireAdmin] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const body = request.body as { name?: string; sourceLanguageId?: number; reviewEnabled?: boolean };
        return service.update(parseInt(projectId), body);
    });

    fastify.delete('/:projectId', { preHandler: [requireAdmin] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        return service.delete(parseInt(projectId));
    });

    fastify.post('/:projectId/languages', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const { languageId } = request.body as { languageId: number };
        const result = await service.addLanguage(parseInt(projectId), languageId);
        
        if (request.user) {
            const { activityLogs } = await import('../../schema');
            await fastify.db.insert(activityLogs).values({
                userId: request.user.id,
                projectId: parseInt(projectId),
                action: 'LANGUAGE_ADDED',
                details: JSON.stringify({ languageId })
            }).execute();
        }
        
        return result;
    });

    fastify.get('/:projectId/languages', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        return service.getProjectLanguages(parseInt(projectId));
    });

    fastify.delete('/:projectId/languages/:languageId', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, languageId } = request.params as { projectId: string, languageId: string };
        return service.removeLanguage(parseInt(projectId), parseInt(languageId));
    });

    fastify.post('/:projectId/languages/bulk-delete', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const { languageIds } = request.body as { languageIds: number[] };
        return service.bulkRemoveLanguages(parseInt(projectId), languageIds);
    });

    fastify.put('/:projectId/source-language', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const { languageId } = request.body as { languageId: number };
        return service.setSourceLanguage(parseInt(projectId), languageId);
    });

    fastify.get('/:projectId/languages/:languageId/export', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, languageId } = request.params as { projectId: string, languageId: string };
        return service.exportTranslations(parseInt(projectId), parseInt(languageId));
    });

    fastify.post('/:projectId/languages/:languageId/import', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, languageId } = request.params as { projectId: string, languageId: string };
        const data = request.body as Record<string, string>;
        return service.importTranslations(parseInt(projectId), parseInt(languageId), data);
    });
}
