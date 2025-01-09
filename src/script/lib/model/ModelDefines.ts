/**
 * The character used to separate the parts of the full name of a component
 */
export const NAME_SEPARATOR_CHAR = ':';

/**
 * Binary Flags that are computed to the base 2
 * Math.pow(2, i) === 2 ** i
 */
/* prettier-ignore */
export enum ChangeFlags {
  NothingChanged       = 0,
  ValueChanged         = 2 ** 0,
  EnableChanged        = 2 ** 1,
  VisibleChanged       = 2 ** 2,
  SelectedChanged      = 2 ** 3,
  ContainerChanged     = 2 ** 4,
  ContainerItemChanged = 2 ** 5,
  ComponentAdded       = 2 ** 6,
  ComponentRemoved     = 2 ** 7,
}
