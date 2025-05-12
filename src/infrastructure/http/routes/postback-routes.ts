import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { HotmartPostbackModel } from '../../database/mongoose/models/HotmartPostbackModel.js';
import { EventDispatcher } from '../../../shared/EventDispatcher.js';
import {
  HotmartPostbackReceivedEvent,
  HotmartPostbackReceivedEventData,
} from '../../../domain/events/HotmartPostbackReceivedEvent.js';

const eventDispatcher = EventDispatcher.getInstance();

export default function (
  server: FastifyInstance,
  opts: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) {
  server.post('/hotmart', async (request, reply) => {
    try {
      const model = await new HotmartPostbackModel({
        payload: request.body as object,
        status: 'queued',
      }).save();

      const event = new HotmartPostbackReceivedEvent({
        ...(request.body as object),
        mongoId: model._id,
      } as HotmartPostbackReceivedEventData);

      eventDispatcher.dispatch(event).catch(console.error);
      return reply.status(200).send();
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  done();
}
