/* eslint-disable @typescript-eslint/no-empty-function */
import Component from './Component';
import Observer from './Observer';

export default class BasicObserver<T extends Component = Component> implements Observer<T> {
  onValueChanged(_sender: T) {}
  onEnabledChanged(_sender: T) {}
  onVisibleChanged(_sender: T) {}
  onPropertyChanged(_sender: T, _key: string) {}
  onSelectionChanged(_sender: T) {}
  onContainerChanged(_sender: T) {}
  onContainerItemChanged(_sender: T, _origin: T) {}
  onComponentAdded(_sender: T, _addedComponent: T) {}
  onComponentRemoved(_sender: T, _removedComponent: T) {}
}
