import { DomainEvent } from './DomainEvent.js';

export abstract class Entity {
  private domainEvents: DomainEvent[] = [];

  addDomainEvent(domainEvent: DomainEvent): void {
    this.domainEvents.push(domainEvent);
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }
}
