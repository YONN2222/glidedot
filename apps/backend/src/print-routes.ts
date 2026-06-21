import Fastify from 'fastify';
import { buildApp } from './app';

async function start() {
    const app = await buildApp();
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/v1/admin/users' });
    console.log('/v1/admin/users status:', res.statusCode);
    
    console.log(app.printRoutes());
}

start().catch(console.error);
