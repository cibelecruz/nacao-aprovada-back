import { DomainEvent } from "./DomainEvent.js";


export class EventDispatcher {
  public handlers: Map<
    string,
    Array<(event: DomainEvent) => void | Promise<void>>
  > = new Map();
  static _instance: EventDispatcher;

  private constructor() {};

  registerHandler(
    event: string,
    handler: (event: DomainEvent) => void | Promise<void>,
  ): void {
    const eventType = event;
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)?.push(handler);
  }

  async dispatch(event: DomainEvent): Promise<void> {
    const eventType = event.eventType;
    const handlers = this.handlers.get(eventType) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }

  static getInstance() {
    if (!EventDispatcher._instance) {
      EventDispatcher._instance = new EventDispatcher();
    }
    return EventDispatcher._instance;
  }
}
