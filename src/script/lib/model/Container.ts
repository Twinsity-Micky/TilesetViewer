import Component from './Component';

/**
 * This interface describes the functionality of a container. Container is designed to
 * create hierarchical models also known as the compositum pattern.
 * 
 * @see {@link Component}
 * @see Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides: Design Patterns - Elements of Reusable Object-Oriented Software.
 * @template T - The default for the template parameter is Component\<any\> because a container holds a list of Components of any type.
 * @author Michael Hagen
 */
export default interface Container<T extends Component = Component> extends Component<null> {
  /**
   * Return the specified component.
   * 
   * @param name The name of the component
   * @returns The specified component or null if not found
   */
  get(name: string): T;

  /**
   * Adds a component to the end of this container. If there is already a component with the
   * same name, the old component is deleted before adding the new component.
   *
   * Fires a container changed event to inform all observers about the change.
   * 
   * @param component The component to add
   */
  add(component: T): void;

  /**
   * Inserts a component into this container. The key specifies the position within the container
   * The component will be inserted right in front of the component with the name equals to the key.
   *
   * If there is no component with the key the specified component will be added to the end.
   *
   * If there is already a component with the same name, the old component is deleted before adding the
   * new component. Fires a container changed event to inform all observers about the change.
   * 
   * @param key The name of the component to insert the specified component in front of
   * @param component The component to insert
   */
  insert(key: string, component: T): void;

  /**
   * Inserts a component into this container. The key specifies the position within the container
   * The component will be inserted right after the component with the name equals to the key.
   *
   * If there is no component with the key the specified component will be added to the end.
   *
   * If there is already a component with the same name, the old component is deleted before adding the
   * new component.
   *
   * Fires a container changed event to inform all observers about the change.
   * 
   * @param key The name of the component to insert the specified component after
   * @param component The component to insert
   */
  insertAfter(key: string, component: T): void;

  /**
   * Deletes the component specified by the key (the name of the component) parameter. Before the component is removed
   * from the container all observers are removed from the component and the components clear method is called.
   *
   * Fires a container changed event to inform all observers about the change.
   * 
   * @param key The name of the component to delete
   * @returns true if the component is deleted otherwise false
   */
  delete(key: string): boolean;

  /**
   * Removes the component specified by the key (the name of the component) parameter.
   *
   * Fires a container changed event to inform all observers about the change.
   * 
   * @param key The name of the component to remove
   * @returns true if the component is deleted otherwise false
   */
  remove(key: string): boolean;

  /**
   * Removes all components from this container. Before a component is removed the observers of the
   * component are also removed and the clear method of the component is called.
   *
   * Fires a container changed event to inform all observers about the change.
   */
  clear(): void;

  /**
   * Move component one position up in the list of contained components
   * 
   * @param component The component to move
   */
  moveUp(component: T): void;

  /**
   * Move component one position down in the list of contained components
   * 
   * @param component The component to move
   */
  moveDown(component: T): void;

  /**
   * Returns the first component in the list of components contained in this container
   * 
   * @returns The first component  or null if there are no components in the container
   */
  first(): T;

  /**
   * Returns the last component in the list of components contained in this container
   * 
   * @returns The last component or null if there are no components in the container
   */
  last(): T;

  /**
   * Returns the previous component to the specified component in the list of components
   * contained in this container
   * 
   * @param startComponent The component to start
   */
  prev(startComponent: T): T;

  /**
   * Returns the next component to the specified component in the list of components
   * contained in this container
   * 
   * @param startComponent The component to start
   */
  next(startComponent: T): T;

  /**
   * Traverse through all the components in the component map and find a component
   *
   * Make sure to check the type with `instanceof` for specific node types
   * @param predicate find calls predicate once for each element of the componentMap, in ascending
   * order, until it finds one where predicate returns true. If such an element is found, find
   * immediately returns that element value. Otherwise, find returns undefined.
   */
  find<S extends T>(predicate: (component: T, key: string) => component is S): S | undefined;
  find(predicate: (component: T, key: string) => boolean): T | undefined;

  /**
   * Traverse deep (recursively) through all the components in the component map and find a component
   *
   * Make sure to check the type with `instanceof` for specific node types
   * @param predicate findDeep calls predicate once for each element of the componentMap and their children (thus deep), in ascending
   * order, until it finds one where predicate returns true. If such an element is found, find
   * immediately returns that element value. Otherwise, find returns undefined.
   */
  findDeep<S extends T>(predicate: (component: T, key: string) => component is S): S | undefined;
  findDeep(predicate: (component: T, key: string) => boolean): T | undefined;

  /**
   * Returns the first visible component in the list of components contained in this container
   * 
   * @returns The first visible component or null if there are no components in the container
   */
  firstVisible(): T;

  /**
   * Returns the last visible component in the list of components contained in this container
   * 
   * @returns The last visible component or null if there are no components in the container
   */
  lastVisible(): T;

  /**
   * Returns the previous visible component to the specified component in the list of components
   * contained in this container
   * @param startComponent The component to start
   */
  prevVisible(startComponent: T, delta: number): T;

  /**
   * Returns the next component to the specified component in the list of components
   * contained in this container
   * @param startComponent The component to start
   */
  nextVisible(startComponent: T, delta: number): T;

  /**
   * @returns true if component is select
   */
  isSelected(): boolean;

  /**
   * @returns the selected component or null if nothing is selected
   */
  getSelectedComponent(): T;

  /**
   * Sets the selected component
   * 
   * @param component the component to select
   */
  setSelectedComponent(component: T | null): void;

  /**
   * Returns the size of this container. The size is the number of components contained in this container.
   * 
   * @returns The size of the container
   */
  size(): number;

  /**
   * Calls a defined callback function on each element of an array, and returns an array that contains the
   * results.
   * 
   * @param callbackFn A function that accepts up to three arguments. The map method calls the callbackfn
   * function one time for each element in the array.
   */
  map<U>(callbackFn: (value: T, index: number, array: T[]) => U): U[];

  /**
   * Returns a subset of components that match the current predicate
   * @param callbackFn predicate
   */
  filterComponents(callbackFn: (value: T, index: number, array: T[]) => boolean): T[];

  /**
   * Executes a provided function once per component contained in this container.
   */
  forEach(callback: (component: T, key?: string) => void): void;

  /**
   * Executes a provided function once per component contained in this container and
   * if the component is a container it delegates the call recursively to the container
   * as well.
   */
  forAll(callback: (component: T) => void): void;

  /**
   * Triggers the container change method of the observers
   * @param origin The component which causes the notification
   */
  fireContainerChanged(origin: T): void;

  /**
   * Triggers the container item change method of the observers
   * @param origin The component which causes the notification
   */
  fireContainerItemChanged(origin: T): void;

  /**
   * Triggers the component added method of the observers
   * @param addedComponent The component which causes the notification
   */
  fireComponentAdded(addedComponent: Component): void;

  /**
   * Triggers the component removed method of the observers
   * @param removedComponent The component which causes the notification
   */
  fireComponentRemoved(removedComponent: Component): void;
}
