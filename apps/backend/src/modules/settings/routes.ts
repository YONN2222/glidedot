import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { settings } from './schema';
import { createAuthHooks } from '../auth/hooks';
import { UserService } from '../auth/services/user.service';
import { TeamService } from '../auth/services/team.service';

export const settingsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  const userService = new UserService(app.db);
  const teamService = new TeamService(app.db);
  const { requireAdmin } = createAuthHooks(userService, teamService);

  // Anyone can read public settings (like theming) or we can make it public.
  // Actually, we'll just allow authenticated users to read settings for now,
  // or we can make GET public if it's strictly for UI appearance.
  app.get('/', async (request, reply) => {
    const allSettings = await app.db.select().from(settings);
    const settingsObj: Record<string, any> = {};
    for (const row of allSettings) {
      settingsObj[row.key] = row.value;
    }
    const { env } = await import('../../config/env');
    settingsObj['s3Configured'] = !!(env.S3_ENDPOINT && env.S3_BUCKET && env.S3_ACCESS_KEY && env.S3_SECRET_KEY);
    return settingsObj;
  });

  app.post('/', {
    preHandler: [requireAdmin]
  }, async (request, reply) => {
    const body = request.body as Record<string, string>;
    const entries = Object.entries(body);
    for (const [key, value] of entries) {
      await app.db.insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value }
        });
    }
    return { success: true };
  });
};
