import { DomainEvent } from '../../shared/DomainEvent.js';

export type HotmartPostbackReceivedEventData = {
  mongoId: string;
  event: string;
  data: {
    product: {
      id: number;
    };
    buyer: {
      email: string;
      name: string;
      checkout_phone: string;
      document: string;
    };
  };
};

export class HotmartPostbackReceivedEvent extends DomainEvent {
  static eventName = 'HotmartPostbackReceived';
  constructor(public data: HotmartPostbackReceivedEventData) {
    super('HotmartPostbackReceived');
    this.data = data;
  }
}
