import { FastifyInstance } from 'fastify';
import { languages } from '../../schema';
import { eq } from 'drizzle-orm';

export class LanguageService {
    constructor(private db: FastifyInstance['db']) {}

    async getAll() {
        return this.db.select().from(languages);
    }

    async create(data: { code: string; name: string; flag?: string }) {
        return this.db.insert(languages).values(data)
            .onConflictDoUpdate({
                target: languages.code,
                set: { name: data.name, flag: data.flag }
            })
            .returning();
    }

    async delete(id: number) {
        return this.db.delete(languages).where(eq(languages.id, id));
    }
}

