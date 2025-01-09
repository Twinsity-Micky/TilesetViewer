import Formatter from './Formatter';

export default class NumberFormatter implements Formatter<number> {

  private fractionDigits = 0;

  constructor(fractionDigits: number) {
    this.fractionDigits = fractionDigits;
  }

  toString(val: number): string {
    if (val === undefined) return '';

    if (this.fractionDigits >= 0) return val.toFixed(this.fractionDigits);

    return String(val);
  }

  fromString(val: string): number {
    return Number.parseFloat(val);
  }

}