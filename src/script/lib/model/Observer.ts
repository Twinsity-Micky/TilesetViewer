import Component from './Component';

export default interface Observer<T extends Component = Component> {
  onComponentAdded(_sender: T, _addedComponent: T): void;
  onComponentRemoved(_sender: T, _removedComponent: T): void;  
  /**
   * Whenever changes (single or collected) changes were made to the container this method will be called
   * @param sender
   */
  onContainerChanged(_sender: T): void;
  /**
   * Whenever an item inside of the container changes this method will be called for this specific item
   * @param sender
   * @param origin
   */
  onContainerItemChanged(_sender: T, _origin: T): void;
  onEnabledChanged(_sender: T): void;
  onPropertyChanged(_sender: T, _key: string): void;
  onSelectionChanged(_sender: T): void;
  onValueChanged(_sender: T): void;
  onVisibleChanged(_sender: T): void;
}
