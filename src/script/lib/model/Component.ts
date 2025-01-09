import Container from './Container';
import Formatter from './Formatter';
import { ChangeFlags } from './ModelDefines';
import Observer from './Observer';

/**
 * This interface describes the functionality of a component. Component is designed to create hierarchical models also
 * known as the compositum pattern.
 * 
 * @see {@link Container}
 * @see Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides: Design Patterns - Elements of Reusable Object-Oriented Software.
 * @template T - The concrete typ of the internal value.
 * @author Michael Hagen
 */
export default interface Component<T = any> {
  /**
   * Sets the internal value. This method does not trigger the observers, so use it with care.
   * 
   * @param value The value to set
   */
  _setValue(value: T): void;

  /**
   * Adds the flag to the changed state of this component. This flag is used in updateObserver to call the dedicated method of the observers.
   * 
   * @description Normally you don't have to call this function because the framework does handle the mechanism of triggering the observers.
   * 
   * @param flag The flag to set
   */
  addChangeFlag(flag: ChangeFlags): void;

  /**
   * Adds an observer to this component. Observers are triggered when an internal value/state
   * of this component changes
   * 
   * @param observer The observer to add
   * 
   * @see Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides: Design Patterns - Elements of Reusable Object-Oriented Software.
   */
  addObserver(observer: Observer): void;

  /**
   * Dispose this object. Releases all resources held by this component
   */
  dispose(): void;

  /**
   * Manages the lock and unlock of observer semaphores
   * 
   * @param heavyWork can be async
   */
  doHeavyLifting<F extends (...args: any) => any = (...args: any) => any>(heavyWork: F): ReturnType<F>;

  /**
   * Triggers one of the dedicated methods, depending ion the flag, of the observers
   * 
   * @param flag A flag indicating the observer method to call
   */
  fireChangeEvent(flag: ChangeFlags): void;

  /**
   * Triggers the container item change method of the observers
   * 
   * @param origin The component which causes the notification
   */
  fireContainerItemChanged(origin: Component): void;

  /**
   * Returns the current change state flag set. This flags are used in updateObserver to call the dedicated method of the observers.
   */
  getChangeFlags(): number;

  /**
   * Gets the formatter for this component
   * 
   */
  getFormatter(): Formatter;

  /**
   * Returns the complete name of the component. This means that the whole path to the component is returned. To
   * determine the path the components parent fullName is placed in front of the name separated by a dash. An
   * example of how it would look like is:
   *
   * person-address-street
   *
   * The fullname of a component can be used to find a component within a complex model hierarchy
   * 
   * @see Container.find(fullname: string)
   */
  getFullName(): string;

  /**
   * Returns the current value of the lock count counter.
   * Every call to lockObserver will increase the counter. A call to unlockObserver will decrease the counter.
   * If the counter is greater than 0 the observers will not be triggered if internal value/state changes.
   * 
   * @see Component.lockObserver
   */
  getLockCount(): number;

  /**
   * Returns the name of the component. Every component must have a (container) unique name. This name is used within the
   * parent container to put the component into an internal map.
   * 
   * @returns The name of the component
   */
  getName(): string;

  /**
   * Returns the amount of observers added to this component
   * 
   * @returns The number of observes
   */
  getObserverCount(): number;
  /**
   * Returns the parent container for this component or null if this component does not have a parent container.
   * 
   * @returns The parent container
   */
  getParent(): Container;

  /**
   * Returns the internal value as a string representation
   * 
   * @returns The internal value formatted as a string
   */

  getStringValue(): string;
  /**
   * Returns the internal value
   * 
   * @returns The internal value
   */
  getValue(): T;

  /**
   * This method tests if the passed parameter is a container class
   * 
   * @param component The component we want to know if it's a container
   * 
   * @returns true if component is a container otherwise false
   */
  isContainer(component: Component | Container): component is Container;

  /**
   * Returns the enabled state of this component
   * 
   * @returns true if this component is enabled otherwise false
   */
  isEnabled(): boolean;

  /**
   * Returns the selected state of this component
   * @returns the selected state
   */
  isSelected(): boolean;

  /**
   * Returns the visible state of this component
   * @returns true if this component is visible otherwise false
   */
  isVisible(): boolean;

  /**
   * Stops the triggering of the observers until unlockObservers is called. The combination of lockObserver/unlockObserver
   * can be used to initialize a huge amount of data where you don't want the observers to be triggered on every change. Typically
   * when you load data from backend to initialize a model. Be careful when using this methods. Triggering observers only starts
   * again after a call to unlockObserver so you should always use it in the following way
   * @example
   * try {
   *   component.lockObserver();
   *   // do something
   * } finally {
   *   component.unlockObserver();
   * }
   */
  lockObserver(): void;

  /**
   * Removes all observers from this component
   */
  removeAllObserver(): void;

  /**
   * Removes the flag from the changed state of this component. This flag is used in updateObserver to call the dedicated method of the observers.
   * 
   * @description Normally you don't have to call this function because the framework does handle the mechanism of triggering the observers.
   * 
   * @param flag The flag to set
   * @param deep If true it will try traverse through all sub-components and apply the removal there, too
   */
  removeChangeFlag(flag: ChangeFlags, deep?: boolean): void;

  /**
   * Removes an observer from this component
   * 
   * @param observer The observer to remove
   */
  removeObserver(observer: Observer): void;

  /**
   * Sets the formatter for this component
   * 
   * @param enabled The enabled state to set
   */
  setFormatter(formatter: Formatter): void;

  /**
   * Sets the enabled state of this component
   * 
   * @param enabled The enabled state to set
   */

   setEnabled(enabled: boolean): void;
   /**
   * Sets the parent container for this component. The parent is normally set by adding a component to a container
   * and isn't changed anymore. Use this method with care if you have some special needs
   * 
   * @param parent The parent container to set
   */
  setParent(parent: Container): void;

  /**
   * Set the selected state for this component
   * 
   * @param selected The selected state to set
   * 
   * @see Component.isSelected
   */
  setSelected(selected: boolean): void;

  /**
   * Sets the internal value by using a formatter class to convert the string parameter to the internal value. 
   * 
   * @param value The value to set
   */
  setStringValue(value: string, force: boolean): void;

  /**
   * Sets the internal value. If the new value is not equals the internal value all observers added to this component are triggered
   * 
   * @param value The value to set
   */
  setValue(value: T): void;

  /**
   * Sets the visible state of this component
   * 
   * @param enabled The visible state to set
   */
  setVisible(visible: boolean): void;

  /**
   * Starts the process of notifying the observers again. If a component is changed between the calls of lockObserver and unlockObserver
   * all changes are merged together and submitted once to the observers.
   */
  unlockObserver(): void;

  /**
   * A call to this method triggers the observers.
   * 
   * @description Normally you don't have to call this function because the framework does handle the mechanism of triggering the observers.
   */
  updateObserver(): void;
}
