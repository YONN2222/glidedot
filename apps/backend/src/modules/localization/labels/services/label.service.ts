import { FastifyInstance } from 'fastify';
import { labels } from '../../schema';
import { eq, and, inArray } from 'drizzle-orm';

export class LabelService {
    constructor(private db: FastifyInstance['db']) {}

    async getByProject(projectId: number) {
        return this.db.select().from(labels).where(eq(labels.projectId, projectId));
    }

    async create(data: { projectId: number; name: string; color: string }) {
        return this.db.insert(labels).values(data).returning();
    }

    async update(id: number, projectId: number, data: Partial<{ name: string; color: string }>) {
        return this.db.update(labels)
            .set(data)
            .where(and(eq(labels.id, id), eq(labels.projectId, projectId)))
            .returning();
    }

    async delete(id: number, projectId: number) {
        return this.db.delete(labels).where(and(eq(labels.id, id), eq(labels.projectId, projectId)));
    }

    async bulkDelete(projectId: number, ids: number[]) {
        if (!ids.length) return;
        return this.db.delete(labels).where(and(inArray(labels.id, ids), eq(labels.projectId, projectId)));
    }
}

