import { FastifyInstance } from 'fastify';
import { LabelService } from '../services/label.service';

export default async function labelRoutes(fastify: FastifyInstance) {
    const service = new LabelService(fastify.db);
    const { checkProjectAccess } = fastify.authHooks;

    fastify.get('/:projectId', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        return service.getByProject(parseInt(projectId));
    });

    fastify.post('/:projectId', { preHandler: [checkProjectAccess] }, async (request, reply) => {
        const { projectId } = request.params as { projectId: string };
        const body = request.body as { name: string; color: string };
        const result = await service.create({ ...body, projectId: parseInt(projectId) });
        
        if (request.user) {
            const { activityLogs } = await import('../../schema');
            await fastify.db.insert(activityLogs).values({
                userId: request.user.id,
                projectId: parseInt(projectId),
                action: 'LABEL_CREATED',
                details: JSON.stringify({ name: body.name })
            }).execute();
        }

        reply.status(201).send(result[0]);
    });

    fastify.patch('/:projectId/:id', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, id } = request.params as { projectId: string; id: string };
        const body = request.body as Partial<{ name: string; color: string }>;
        return service.update(parseInt(id), parseInt(projectId), body);
    });

    fastify.delete('/:projectId/:id', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId, id } = request.params as { projectId: string; id: string };
        return service.delete(parseInt(id), parseInt(projectId));
    });

    fastify.post('/:projectId/bulk-delete', { preHandler: [checkProjectAccess] }, async (request) => {
        const { projectId } = request.params as { projectId: string };
        const { ids } = request.body as { ids: number[] };
        return service.bulkDelete(parseInt(projectId), ids);
    });
}
