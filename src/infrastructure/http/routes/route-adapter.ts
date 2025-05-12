import { FastifyReply, FastifyRequest } from "fastify";
import { HttpResponse } from "../utils/responseHelpers.js";

type RouteHandler = (request: FastifyRequest, reply?: FastifyReply) => Promise<HttpResponse>;

export default function (handler: RouteHandler) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        try {
            const result = await handler(request);
            return reply.status(result.statusCode).send(result.body);
          } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
          }
    }
}