import Formatter from './Formatter';

export default class StringFormatter implements Formatter<string> {

  toString(val: string): string {
    return val ? val : '';
  }

  fromString(val: string): string {
    return val;
  }

}