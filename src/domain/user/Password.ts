import { randomInt } from 'crypto';

export class Password {
  private static alphabet = 'abcdefghijklmnopqrstuvwxyz';
  private static alphabetCapital = this.alphabet
    .split('')
    .map((c) => c.toUpperCase())
    .join('');
  private static numbers = '0123456789';
  private static special = '!@#$%&*()+-?';

  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static random(): Password {
    return new Password(
      Array.from({ length: 10 }, (_, i) => {
        if (i === 0) return this.alphabet[randomInt(this.alphabet.length)];
        if (i % 4 === 0) {
          return this.special[randomInt(this.special.length)];
        }
        if (i % 3 === 0) {
          return this.numbers[randomInt(this.numbers.length)];
        }
        if (i % 2 === 0 || i === 7) {
          return this.alphabetCapital[randomInt(this.alphabetCapital.length)];
        }
        return this.alphabet[randomInt(this.alphabet.length)];
      }).join(''),
    );
  }

  static _validate(value: string): boolean {
    return true;
  }

  get value(): string {
    return this._value;
  }

  toString() {
    return this._value;
  }
}
