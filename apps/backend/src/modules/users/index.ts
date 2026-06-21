import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import routes from "./routes";

export default fp(async function usersModule(fastify: FastifyInstance) {
    await fastify.register(routes, { prefix: '/v1/users' });
});
