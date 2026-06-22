import { FastifyInstance } from 'fastify';
import { LabelService } from '../services/label.service';

export default async function labelRoutes(fastify: FastifyInstance) {
    const service = new LabelService(fastify.db);
    const { checkProjectAccess } = fastify.authHooks;

    const logActivity = async (userId: number, projectId: number, action: string, details: string) => {
        const { activityLogs } = await import('../../schema');
        await fastify.db.insert(activityLogs).values({ userId, projectId, action, details }).execute();
    };

    fastify.get('/:projectId', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        return service.getByProject(parseInt(projectId));
    });

    fastify.post('/:projectId', { preHandler: [checkProjectAccess] }, async (request, reply) => {
        const { projectId } = request.params as { projectId: string };
        const body = request.body as { name: string; color: string };
        const result = await service.create({ ...body, projectId: parseInt(projectId) });
        
        if (request.user) {
            await logActivity(request.user.id, parseInt(projectId), 'LABEL_CREATED', JSON.stringify({ name: body.name }));
        }

        reply.status(201).send(result[0]);
    });

    fastify.patch('/:projectId/:id', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, id } = request.params as { projectId: string; id: string };
        const body = request.body as Partial<{ name: string; color: string }>;
        const result = await service.update(parseInt(id), parseInt(projectId), body);
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'LABEL_UPDATED', JSON.stringify({ labelId: id }));
        return result;
    });

    fastify.delete('/:projectId/:id', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, id } = request.params as { projectId: string; id: string };
        const result = await service.delete(parseInt(id), parseInt(projectId));
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'LABEL_DELETED', JSON.stringify({ labelId: id }));
        return result;
    });

    fastify.post('/:projectId/bulk-delete', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const { ids } = request.body as { ids: number[] };
        const result = await service.bulkDelete(parseInt(projectId), ids);
        if (request.user) await logActivity(request.user.id, parseInt(projectId), 'LABEL_DELETED', JSON.stringify({ count: ids.length }));
        return result;
    });
}
