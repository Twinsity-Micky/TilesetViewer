
/**
 * This interface describes the functionality of a formatter. A formatter is a helper class to convert a value to a string and vice versa 
 * 
 * @template T - The concrete typ of the internal value.
 * @author Michael Hagen
*/

export default interface Formatter<T = any> {
  toString(val: T): string;
  fromString(val: string): T;
}