import BasicComponent, { InferredBasicComponentValueType } from './BasicComponent';
import Component from './Component';
import Container from './Container';
import { ChangeFlags, NAME_SEPARATOR_CHAR } from './ModelDefines';
import ModelUtilities from './ModelUtilities';

export type InferredBasicContainerValueType<C> = C extends BasicContainer<infer T> ? T : never;

/**
 * This base class implements the most common parts of the Container interface. Extend from this class for all specialized types of container.
 * 
 * @template T - The default for the template parameter is Component\<any\> because a container holds a list of Components of any type.
 * 
 * @author Michael Hagen
 */
export default class BasicContainer<T extends Component = Component, R = InferredBasicComponentValueType<T>[]>
  extends BasicComponent<R>
  implements Container<T>
{
  protected componentMap = new Map<string, T>();
  protected origin: Component;
  protected addedComponent: Component;
  protected removedComponent: Component;

  /**
   * Constructor for BasicContainer
   * 
   * @param parent The parent container for this container
   * @param name The name of this container
   */
  constructor(parent: Container | null, name: string = null) {
    if (!name) {
      name = ModelUtilities.getUniqueId('container_');
    } else if (name.includes(NAME_SEPARATOR_CHAR)) {
      throw new RangeError(`container constructor --> illegal char '${NAME_SEPARATOR_CHAR}' in name: ${name}`);
    }

    super(parent, name);
  }

  /**
   * @override
   */
  public override dispose(): void {
    this.removeAllObserver();
    this.componentMap.forEach(component => {
      component.dispose();
    });
    this.componentMap.clear();
    super.dispose();
  }

  // ---------------------------
  // Container interface
  // ---------------------------

  /**
   * @override
   */
  public get(name: string): T {
    return this.componentMap.get(name);
  }

  /**
   * @override
   */
  public add(component: T) {
    if (!component?.getName()) return;

    this.detachComponent(component);
    component.setParent(this);
    this.componentMap.set(component.getName(), component);
    this.fireContainerChanged(this);
    this.fireComponentAdded(component);
  }

  /**
   * @override
   */
  public insert(target: string | T, component: T) {
    if (this.componentMap.size === 0) {
      this.add(component);
      return;
    }

    if (!component?.getName() || !target) return;

    const insertBeforeKey = typeof target === 'string' ? target : target.getName();

    // check if component is already in requested position
    if (this.prev(this.get(insertBeforeKey)) === component) return;

    this.detachComponent(component);
    component.setParent(this);

    const newMap = new Map<string, T>();

    if (!insertBeforeKey) {
      newMap.set(component.getName(), component);
    }

    for (const [key, value] of this.componentMap) {
      if (insertBeforeKey && key === insertBeforeKey) {
        newMap.set(component.getName(), component);
      }

      newMap.set(key, value);
    }

    this.componentMap.clear();
    newMap.forEach((component, key) => this.componentMap.set(key, component));
    this.fireContainerChanged(this);
    this.fireComponentAdded(component);
  }

  /**
   * @override
   */
  public insertAfter(target: string | T, component: T) {
    if (this.componentMap.size === 0) {
      this.add(component);
      return;
    }

    if (!component?.getName() || !target) return;

    const insertAfterKey = typeof target === 'string' ? target : target.getName();

    // check if component is already in requested position
    if (this.next(this.get(insertAfterKey)) === component) return;

    this.detachComponent(component);
    component.setParent(this);

    const newMap = new Map<string, T>();

    if (!insertAfterKey) {
      newMap.set(component.getName(), component);
    }

    for (const [key, value] of this.componentMap) {
      newMap.set(key, value);

      if (insertAfterKey && key === insertAfterKey) {
        newMap.set(component.getName(), component);
      }
    }

    this.componentMap.clear();
    newMap.forEach((component, key) => this.componentMap.set(key, component));
    this.fireContainerChanged(this);
    this.fireComponentAdded(component);
  }

  /**
   * @override
   */
  public delete(key: string | T): boolean {
    return this._remove(key, true);
  }

  /**
   * @override
   */
  public remove(key: string | T): boolean {
    return this._remove(key, false);
  }

  private _remove(key: string | T, deleteFlag: boolean): boolean {
    if (!key) return;
    const searchKey = typeof key === 'string' ? key : key.getName();
    const component = this.componentMap.get(searchKey);
    if (component) {
      if (deleteFlag) {
        component.dispose();
      }

      if (this.componentMap.delete(searchKey)) {
        this.fireComponentRemoved(component);
        this.fireContainerChanged(this);
        return true;
      }
    }
    return false;
  }

  /**
   * @override
   */
  public clear() {
    if (this.componentMap.size > 0) {
      this.componentMap.forEach((component) => {
        component.dispose();
        this.fireComponentRemoved(component);
      });
      this.componentMap.clear();
      this.fireContainerChanged(this);
    }
  }

  /**
   * @override
   */
  public moveUp(component: T) {
    if (!component?.getName()) return;
    if (!this.componentMap.has(component.getName())) return;

    const newMap = new Map<string, T>();
    let lastComponent = null;

    for (const [key, val] of this.componentMap) {
      if (key === component.getName()) {
        newMap.set(component.getName(), component);
        if (lastComponent) {
          newMap.set(lastComponent.getName(), lastComponent);
        }

        lastComponent = null;
      } else {
        if (lastComponent) {
          newMap.set(lastComponent.getName(), lastComponent);
        }

        lastComponent = val;
      }
    }

    if (lastComponent) {
      newMap.set(lastComponent.getName(), lastComponent);
    }

    this.componentMap.clear();
    newMap.forEach((component, key) => this.componentMap.set(key, component));
    this.fireContainerChanged(this);
  }

  /**
   * @override
   */
  public moveDown(component: T) {
    if (!component?.getName()) return;
    if (!this.componentMap.has(component.getName())) return;

    const newMap = new Map<string, T>();
    let componentToMove = null;

    for (const [key, val] of this.componentMap) {
      if (key === component.getName()) {
        componentToMove = val;
      } else {
        newMap.set(key, val);
        if (componentToMove) {
          newMap.set(componentToMove.getName(), componentToMove);
          componentToMove = null;
        }
      }
    }

    if (componentToMove) {
      newMap.set(componentToMove.getName(), componentToMove);
    }

    this.componentMap.clear();
    newMap.forEach((component, key) => this.componentMap.set(key, component)); // Maybe extract it to a function for reuse
    this.fireContainerChanged(this);
  }

  /**
   * @override
   */
  public first(): T {
    if (!this.componentMap.size) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_firstKey, firstComponent] = [...this.componentMap].shift() ?? [];
    return firstComponent;
  }

  /**
   * @override
   */
  public last(): T {
    if (!this.componentMap.size) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_lastKey, lastComponent] = [...this.componentMap].pop() ?? [];
    return lastComponent;
  }

  /**
   * @override
   */
  public prev(component: T): T {
    if (!component) return null;

    let previous: T = null;
    const name = component.getName();

    for (const [key, value] of this.componentMap) {
      if (name === key) return previous;

      previous = value;
    }

    return null;
  }

  /**
   * @override
   */
  public next(component: T): T {
    if (!component) return null;
    let found = false;
    const name = component.getName();

    for (const [key, value] of this.componentMap) {
      if (found) return value;

      if (name === key) found = true;
    }

    return null;
  }

  /**
   * @override
   */
  public find(predicate: (component: T, key: string) => boolean): T;
  public find<S extends T>(predicate: (component: T, key: string) => component is S): S;
  public find(predicate: (component: T, key: string) => boolean): T {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_foundKey, foundComponent] =
      [...this.componentMap].find(([key, component]) => predicate(component, key)) ?? [];
    return foundComponent;
  }

  /**
   * @override
   */
  public findDeep(predicate: (component: T, key: string) => boolean): T;
  public findDeep<S extends T>(predicate: (component: T, key: string) => component is S): S;
  public findDeep(predicate: (component: T, key: string) => boolean): T {
    // look if found in current components
    const foundHere = this.find(predicate);

    if (foundHere) return foundHere;

    // nothing found, so look deeper
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    search: for (const [_key, component] of this.componentMap) {
      // only look for containers for traversal
      if (!(component instanceof BasicContainer)) continue search;

      const foundDeep = component.findDeep(predicate);
      if (foundDeep) return foundDeep;

      // continue search;
    }

    // nothing found
    return null;
  }

  /**
   * @override
   */
  public firstVisible(): T {
    let firstComponent = this.first();
    if (firstComponent && !firstComponent.isVisible()) {
      firstComponent = this.nextVisible(firstComponent, 1);
    }
    return firstComponent;
  }

  /**
   * @override
   */
  public lastVisible(): T {
    let lastComponent = this.last();
    if (lastComponent && !lastComponent.isVisible()) {
      lastComponent = this.prevVisible(lastComponent, 1);
    }
    return lastComponent;
  }

  /**
   * @override
   */
  public prevVisible(startComponent: T, delta: number): T {
    let result = null;
    let count = 0;
    if (startComponent) {
      let found = false;
      const componentArray = [...this.componentMap.values()];

      for (let i = componentArray.length - 1; i >= 0; i--) {
        const component = componentArray[i];
        if (found && component.isVisible()) {
          count++;
          if (count >= delta) {
            result = component;
            break;
          }
        }
        if (startComponent.getName() === component.getName()) {
          found = true;
        }
      }
    }
    return result;
  }

  /**
   * @override
   */
  public nextVisible(startComponent: T, delta: number): T {
    let result = null;
    let count = 0;
    if (startComponent) {
      let found = false;

      for (const component of this.componentMap.values()) {
        if (found && component.isVisible()) {
          count++;
          if (count >= delta) {
            result = component;
            break;
          }
        }
        if (startComponent.getName() === component.getName()) {
          found = true;
        }
      }
    }
    return result;
  }

  /**
   * @override
   */
  public size(): number {
    return this.componentMap.size;
  }

  public sizeVisible(): number {
    let count = 0;

    for (const component of this.componentMap.values()) {
      if (component.isVisible()) count++;
    }

    return count;
  }

  /**
   * @override
   */
  public map<U>(callbackFn: (value: T, index: number, array: T[]) => U): U[] {
    return [...this.componentMap.values()].map(callbackFn);
  }

  /**
   * @override
   */
  public filterComponents(callbackFn: (value: T, index: number, array: T[]) => boolean): T[] {
    return [...this.componentMap.values()].filter(callbackFn);
  }

  /**
   * @override
   */
  public forEach(callback: (value: T, key?: string) => void) {
    this.componentMap.forEach(callback);
  }

  /**
   * @override
   */
  public forAll(callback: (component: T) => void) {
    this._forAll(this, callback);
  }

  private _forAll(container: Container, callback: (component: T) => void) {
    callback(container as any);
    container.forEach((component: T) => {
      if (this.isContainer(component)) {
        this._forAll(component, callback);
      } else {
        callback(component);
      }
    });
  }

  /**
   * @override
   */
  public getSelectedComponent(): T {
    return this.findDeep((component) => component.isSelected());
  }

  /**
   * @override
   */
  public setSelectedComponent(component: T | null) {
    const oldSelectedComponent = this.getSelectedComponent();

    // component is already selected, nothing to do here
    if (component === oldSelectedComponent) return;

    this.doHeavyLifting(() => {
      this.forAll((c) => c.setSelected(false));

      if (oldSelectedComponent) {
        this.fireChangeEvent(ChangeFlags.SelectedChanged);
      }

      if (component) {
        component.setSelected(true);
        this.fireChangeEvent(ChangeFlags.SelectedChanged);
      }
    });

    return oldSelectedComponent;
  }

  // ---------------------------
  // Component interface
  // ---------------------------

  /**
   * @override
   */
  public override getValue(): null {
    return null;
  }

  /**
   * @override
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override setValue(_value: any) {
    // Container doesn't have a value
  }

  /**
   * @override
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public override _setValue(_value: any) {
    // Container doesn't have a value
  }

  /**
   * @override
   */
  public override lockObserver() {
    super.lockObserver();
    this.componentMap.forEach((component) => {
      component.lockObserver();
    });
  }

  /**
   * @override
   */
  public override unlockObserver() {
    this.componentMap.forEach((component) => {
      component.unlockObserver();
    });
    super.unlockObserver();
  }

  /**
   * Override because we override lockObserver too
   * 
   * @override
   */
  public override doHeavyLifting<F extends (...args: any) => any = (...args: any) => any>(heavyWork: F): ReturnType<F> {
    try {
      this.lockObserver();
      const returnValue = heavyWork();
      if (returnValue instanceof Promise) {
        return returnValue.finally(() => {
          this.unlockObserver();
        }) as ReturnType<F>;
      }

      this.unlockObserver();
      return returnValue;
    } catch (e) {
      this.unlockObserver();
      throw e;
    }
  }

  /**
   * @override
   */
  public override updateObserver() {
    if (this.getLockCount() !== 0) return;

    this.componentMap.forEach((component) => component.updateObserver());

    if (!this.hasChangeFlags()) return;

    if (this.extractChangeFlag(ChangeFlags.ContainerChanged)) this.fireContainerChanged(this);
    if (this.extractChangeFlag(ChangeFlags.ContainerItemChanged)) this.fireContainerItemChanged(this.origin ?? this);
    if (this.extractChangeFlag(ChangeFlags.ComponentRemoved)) this.fireComponentRemoved(this.removedComponent);
    if (this.extractChangeFlag(ChangeFlags.ComponentAdded)) this.fireComponentAdded(this.addedComponent);

    super.updateObserver();

    // if (this.hasChangeFlags()) {
    //   logger.warn('Possible bug: changedFlags still had unhandled flags:', this.changedFlags);
    //   this.removeAllChangeFlags();
    // }
  }

  /**
   * @override
   */
  public override removeChangeFlag(flag: ChangeFlags, deep?: boolean) {
    super.removeChangeFlag(flag);

    if (!deep) return;

    this.componentMap.forEach((component) => {
      component.removeChangeFlag(flag, deep);
    });
  }

  public fireContainerChanged(origin: Component) {
    this.origin = origin;

    if (this.getLockCount() > 0) {
      this.addChangeFlag(ChangeFlags.ContainerChanged);
      return;
    }

    this.observerSet.forEach((observer) => observer.onContainerChanged(this));
    this.parent?.fireContainerItemChanged(origin);

    this.origin = null;
  }

  /**
   * @override
   */
  public override fireContainerItemChanged(origin: Component) {
    this.origin = origin;
    if (this.getLockCount() > 0) {
      this.addChangeFlag(ChangeFlags.ContainerItemChanged);
      return;
    }

    this.observerSet.forEach((observer) => observer.onContainerItemChanged(this, origin));
    this.parent?.fireContainerItemChanged(origin);

    this.origin = null;
  }

  /**
   * @override
   */
  public fireComponentAdded(addedComponent: Component) {
    this.addedComponent = addedComponent;
    if (this.getLockCount() > 0) {
      this.addChangeFlag(ChangeFlags.ComponentAdded);
      return;
    }

    this.observerSet.forEach((observer) => {
      observer.onComponentAdded(this, addedComponent);
    });
  }

  /**
   * @override
   */
  public fireComponentRemoved(removedComponent: Component) {
    this.removedComponent = removedComponent;
    if (this.getLockCount() > 0) {
      this.addChangeFlag(ChangeFlags.ComponentRemoved);
      return;
    }

    this.observerSet.forEach((observer) => {
      observer.onComponentRemoved(this, removedComponent);
    });
  }

  protected detachComponent(component: Component) {
    if (!component) return;

    const name = component.getName();

    // when component is not attached here delete (unobserve) it first
    if (component !== this.get(name)) return this.delete(name);

    // when component is currently attached here remove it first
    return this.remove(name);
  }
}
