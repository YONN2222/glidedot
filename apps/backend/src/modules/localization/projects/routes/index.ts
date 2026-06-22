import { FastifyInstance } from 'fastify';
import { ProjectService } from '../services/project.service';

export default async function projectRoutes(fastify: FastifyInstance) {
    const service = new ProjectService(fastify.db);
    const { checkProjectAccess, requireAdmin } = fastify.authHooks;

    const logActivity = async (userId: number, projectId: number | null, action: string, details: string) => {
        if (!projectId) return;
        const { activityLogs } = await import('../../schema');
        await fastify.db.insert(activityLogs).values({ userId, projectId, action, details }).execute();
    };

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
            await logActivity(request.user.id, newProject.id, 'PROJECT_CREATED', JSON.stringify({ name: body.name }));
        }
        
        reply.status(201).send(newProject);
    });

    fastify.patch('/:projectId', { preHandler: [requireAdmin] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const body = request.body as { name?: string; sourceLanguageId?: number; reviewEnabled?: boolean; requireTemplate?: boolean; inContextUrl?: string | null };
        const result = await service.update(parseInt(projectId), body);
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'PROJECT_UPDATED', JSON.stringify(body));
        return result;
    });

    fastify.delete('/:projectId', { preHandler: [requireAdmin] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const result = await service.delete(parseInt(projectId));
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'PROJECT_DELETED', JSON.stringify({ projectId }));
        return result;
    });

    fastify.post('/:projectId/languages', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const { languageId } = request.body as { languageId: number };
        const result = await service.addLanguage(parseInt(projectId), languageId);
        
        if (request.user) {
            await logActivity(request.user.id, parseInt(projectId), 'LANGUAGE_ADDED', JSON.stringify({ languageId }));
        }
        
        return result;
    });

    fastify.get('/:projectId/languages', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        return service.getProjectLanguages(parseInt(projectId));
    });

    fastify.delete('/:projectId/languages/:languageId', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, languageId } = request.params as { projectId: string, languageId: string };
        const result = await service.removeLanguage(parseInt(projectId), parseInt(languageId));
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'LANGUAGE_REMOVED', JSON.stringify({ languageId }));
        return result;
    });

    fastify.post('/:projectId/languages/bulk-delete', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const { languageIds } = request.body as { languageIds: number[] };
        const result = await service.bulkRemoveLanguages(parseInt(projectId), languageIds);
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'LANGUAGE_REMOVED', JSON.stringify({ count: languageIds.length }));
        return result;
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

    // PUBLIC ENDPOINT
    fastify.get('/:projectId/translations/:langCode', async (request, reply) => {
        const { projectId, langCode } = request.params as { projectId: string, langCode: string };
        
        // Ensure CORS headers are explicitly set for public consumption
        reply.header('Access-Control-Allow-Origin', '*');
        
        return service.exportTranslationsByCode(parseInt(projectId), langCode);
    });

    fastify.post('/:projectId/languages/:languageId/import', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, languageId } = request.params as { projectId: string, languageId: string };
        const body = request.body as { data: Record<string, string>, importAsPending?: boolean } | Record<string, string>;
        
        // Handle backwards compatibility where body is just the data object
        const isLegacyFormat = !('data' in body) || typeof body.data !== 'object';
        const data = isLegacyFormat ? body as Record<string, string> : (body as { data: Record<string, string> }).data;
        const importAsPending = isLegacyFormat ? false : (body as { importAsPending?: boolean }).importAsPending ?? false;

        const result = await service.importTranslations(parseInt(projectId), parseInt(languageId), data, importAsPending);
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'TRANSLATIONS_IMPORTED', JSON.stringify({ languageId, count: Object.keys(data).length }));
        return result;
    });

    // --- Key Templates ---
    fastify.get('/:projectId/templates', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        return service.getTemplates(parseInt(projectId));
    });

    fastify.post('/:projectId/templates', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const body = request.body as { name: string, segments: string };
        const result = await service.createTemplate(parseInt(projectId), body);
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'TEMPLATE_CREATED', JSON.stringify({ name: body.name }));
        return result;
    });

    fastify.patch('/:projectId/templates/:templateId', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, templateId } = request.params as { projectId: string, templateId: string };
        const body = request.body as { name?: string, segments?: string };
        const result = await service.updateTemplate(parseInt(templateId), body);
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'TEMPLATE_UPDATED', JSON.stringify({ templateId }));
        return result;
    });

    fastify.delete('/:projectId/templates/:templateId', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, templateId } = request.params as { projectId: string, templateId: string };
        const result = await service.deleteTemplate(parseInt(templateId));
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'TEMPLATE_DELETED', JSON.stringify({ templateId }));
        return result;
    });

    // --- Key Glossary ---
    fastify.get('/:projectId/glossary', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        return service.getGlossary(parseInt(projectId));
    });

    fastify.post('/:projectId/glossary', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const body = request.body as { badWord: string, goodWord: string };
        const result = await service.createGlossaryTerm(parseInt(projectId), body);
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'GLOSSARY_TERM_CREATED', JSON.stringify({ badWord: body.badWord }));
        return result;
    });

    fastify.patch('/:projectId/glossary/:glossaryId', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, glossaryId } = request.params as { projectId: string, glossaryId: string };
        const body = request.body as { badWord?: string, goodWord?: string };
        const result = await service.updateGlossaryTerm(parseInt(glossaryId), body);
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'GLOSSARY_TERM_UPDATED', JSON.stringify({ glossaryId }));
        return result;
    });

    fastify.delete('/:projectId/glossary/:glossaryId', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, glossaryId } = request.params as { projectId: string, glossaryId: string };
        const result = await service.deleteGlossaryTerm(parseInt(glossaryId));
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'GLOSSARY_TERM_DELETED', JSON.stringify({ glossaryId }));
        return result;
    });

    // --- Key Variables ---
    fastify.get('/:projectId/variables', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        return service.getVariables(parseInt(projectId));
    });

    fastify.post('/:projectId/variables', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const body = request.body as { name: string, options: string };
        const result = await service.createVariable(parseInt(projectId), body);
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'VARIABLE_CREATED', JSON.stringify({ name: body.name }));
        return result;
    });

    fastify.patch('/:projectId/variables/:variableId', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, variableId } = request.params as { projectId: string, variableId: string };
        const body = request.body as { name?: string, options?: string };
        const result = await service.updateVariable(parseInt(variableId), body);
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'VARIABLE_UPDATED', JSON.stringify({ variableId }));
        return result;
    });

    fastify.delete('/:projectId/variables/:variableId', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, variableId } = request.params as { projectId: string, variableId: string };
        const result = await service.deleteVariable(parseInt(variableId));
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'VARIABLE_DELETED', JSON.stringify({ variableId }));
        return result;
    });

    // --- Conventions Import/Export ---
    fastify.get('/:projectId/conventions/export', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        return service.exportConventions(parseInt(projectId));
    });

    fastify.post('/:projectId/conventions/import', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const body = request.body as { templates?: any[], glossary?: any[], variables?: any[] };
        const result = await service.importConventions(parseInt(projectId), body);
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'CONVENTIONS_IMPORTED', JSON.stringify({}));
        return result;
    });
}
