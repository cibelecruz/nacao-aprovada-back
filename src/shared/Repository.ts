import { Entity } from "./Entity.js";
import { EventDispatcher } from "./EventDispatcher.js";

export abstract class Repository {
    constructor(private eventDispatcher: EventDispatcher) {}

    protected async dispatchEvents(entity: Entity) {
        const events = entity.getDomainEvents();
        for (const event of events) {
            await this.eventDispatcher.dispatch(event);
        }
        entity.clearDomainEvents();
    }
}