import { randomUUID } from "crypto";

export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string;
  public readonly version: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract data: any;

  protected constructor(eventType: string, version = 1) {
    this.eventId = this.generateUniqueId();
    this.eventType = eventType;
    this.occurredOn = new Date();
    this.version = version;
  }

  private generateUniqueId(): string {
    return randomUUID();
  }
}
