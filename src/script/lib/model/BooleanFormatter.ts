import Formatter from './Formatter';

export default class BooleanFormatter implements Formatter<boolean> {

  toString(val: boolean): string {
    return (val === null) ? '' : (val === true) ? 'true' : 'false';
  }

  fromString(val: string): boolean {
    if (val === null || val === '') {
      return null;
    }
    return (val === 'true');
  }

}