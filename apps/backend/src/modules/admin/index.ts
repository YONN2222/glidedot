import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import routes from "./routes";

export default fp(async function adminModule(fastify: FastifyInstance) {
    await fastify.register(routes, { prefix: '/v1/admin' });
});
