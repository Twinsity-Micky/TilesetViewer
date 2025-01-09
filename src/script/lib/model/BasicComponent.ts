import Component from './Component';
import Container from './Container';
import Formatter from './Formatter';
import { ChangeFlags, NAME_SEPARATOR_CHAR } from './ModelDefines';
import ModelUtilities from './ModelUtilities';
import Observer from './Observer';

export type InferredBasicComponentValueType<C> = C extends Component<infer T> ? T : never;

/**
 * This abstract base class implements the most common parts of the Component interface. The specialized
 * classes like StringComponent, NumberComponent etc. are derivations of this class.
 * @template T - The default for the template parameter is any because this is only the base class for concrete
 * component implementations with concrete types.
 * 
 * @author Michael Hagen
 */
export default class BasicComponent<T = any> implements Component<T> {
  protected parent: Container;
  protected name: string;
  protected fullName: string;
  protected value: T;
  protected enabled = true;
  protected visible = true;
  protected selected = false;
  protected formatter: Formatter;

  /**
   * semaphore for locking observers in observerSet
   */
  protected lockCount = 0;
  protected readonly observerSet = new Set<Observer>();
  protected changedFlags = 0;

  /**
   * Constructor for BasicComponent
   * 
   * @param {Container} parent The parent container for this component
   * @param {string} name The name of this component
   * @param {T} value The initial value for this component
   */
  constructor(parent: Container | null, name: string = null, value: T = null) {
    if (!name) {
      name = ModelUtilities.getUniqueId('component_');
    } else if (name.includes(NAME_SEPARATOR_CHAR)) {
      throw new RangeError(
        `component constructor --> illegal char '${NAME_SEPARATOR_CHAR}' in component with name: ${name}`
      );
    }

    this.lockCount = !parent ? 0 : parent.getLockCount();
    this.name = name;
    this.value = value;
    this.setParent(parent);
  }

  public dispose(): void {
    this.removeAllObserver();
    this.setParent(null);
  }

  /**
   * @override
   */
  public isContainer(component: Component | Container): component is Container {
    return (component as Container)?.fireContainerChanged !== undefined;
  }

  /**
   * @override
   */
  public getParent(): Container {
    return this.parent;
  }

  /**
   * @override
   */
  public setParent(parent: Container) {
    if (this.parent === parent) return;

    this.parent = parent;
  }

  /**
   * @override
   */
  public getName(): string {
    return this.name;
  }

  /**
   * @override
   */
  public getFormatter(): Formatter {
    return this.formatter;
  }

  /**
   * @override
   */
  public getFullName(): string {
    if (this.fullName) return this.fullName;

    this.fullName = this.getName();
    let parent = this.getParent();

    while (parent) {
      this.fullName = parent.getName() + NAME_SEPARATOR_CHAR + this.fullName;
      parent = parent.getParent();
    }

    return this.fullName;
  }

  /**
   * @override
   */
  public getStringValue(): string {
    if (this.formatter) {
      return this.formatter.toString(this.value);
    }
    return null;
  }


  /**
   * @override
   */
  public getValue(): T {
    return this.value;
  }

  /**
   * @override
   */
  public setFormatter(formatter: Formatter) {
    this.formatter = formatter;
  }

  /**
   * @override
   */
  public setStringValue(value: string, force: boolean) {
    if (this.formatter) {
      const val = this.formatter.fromString(value);
      if (val !== null) {
        this.setValue(val);
      } else {
        if (force) {
          this.setValue(null);
        }
      }
    }
  }

  /**
   * @override
   */
  public setValue(value: T) {
    if (this.value === value) return;

    this.value = value;
    this.fireChangeEvent(ChangeFlags.ValueChanged);
    this.fireContainerItemChanged(this);
  }

  /**
   * @override
   */
  public _setValue(value: T) {
    if (this.value === value) return;

    this.value = value;
  }

  /**
   * Returns the internal value. Same as getValue
   * @returns {T} The internal value
   */
  public valueOf(): T {
    return this.getValue();
  }

  /**
   * @override
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * @override
   */
  public setEnabled(enabled: boolean) {
    if (this.enabled === enabled) return;

    this.enabled = enabled;
    this.fireChangeEvent(ChangeFlags.EnableChanged);
    this.fireContainerItemChanged(this);
  }

  /**
   * @override
   */
  public isVisible(): boolean {
    return this.visible;
  }

  /**
   * @override
   */
  public setVisible(visible: boolean) {
    if (this.visible === visible) return;

    this.visible = visible;
    this.fireChangeEvent(ChangeFlags.VisibleChanged);
    this.fireContainerItemChanged(this);
  }

  /**
   * @override
   */
  public isSelected(): boolean {
    return this.selected;
  }

  /**
   * @override
   */
  public setSelected(selected: boolean) {
    if (this.selected === selected) return;

    this.selected = selected;
    this.fireChangeEvent(ChangeFlags.SelectedChanged);
    this.fireContainerItemChanged(this);
  }

  /**
   * @override
   */
  public getObserverCount(): number {
    return this.observerSet.size;
  }

  /**
   * @override
   */
  public addObserver(observer: Observer) {
    this.observerSet.add(observer);
  }

  /**
   * @override
   */
  public removeObserver(observer: Observer) {
    this.observerSet.delete(observer);
  }

  /**
   * @override
   */
  public removeAllObserver() {
    this.observerSet.clear();
  }

  /**
   * @override
   */
  public getLockCount(): number {
    return this.lockCount;
  }

  /**
   * @override
   */
  public lockObserver() {
    this.lockCount++;
  }

  /**
   * @override
   */
  public unlockObserver() {
    this.lockCount = Math.max(0, this.lockCount - 1);
    if (this.lockCount === 0) {
      this.updateObserver();
    }
  }

  /**
   * @override
   */
  public doHeavyLifting<F extends (...args: any) => any = (...args: any) => any>(heavyWork: F): ReturnType<F> {
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
  public updateObserver() {
    if (this.getLockCount() !== 0) return;
    if (!this.hasChangeFlags()) return;

    const valueChanged = this.extractChangeFlag(ChangeFlags.ValueChanged);
    const enableChanged = this.extractChangeFlag(ChangeFlags.EnableChanged);
    const visibleChanged = this.extractChangeFlag(ChangeFlags.VisibleChanged);
    const selectedChanged = this.extractChangeFlag(ChangeFlags.SelectedChanged);

    this.observerSet.forEach((observer) => {
      if (valueChanged) observer.onValueChanged(this);
      if (enableChanged) observer.onEnabledChanged(this);
      if (visibleChanged) observer.onVisibleChanged(this);
      if (selectedChanged) observer.onSelectionChanged(this);
    });
  }

  /**
   * extracts a ChangeFlag from the present {@link changedFlags}
   *
   * This method is handy when iterating through all the possible ChangedFlags,
   * like in {@link updateObserver}
   * 
   * @param flag flag to be extracted
   * @returns the extracted flag or 0
   */
  protected extractChangeFlag(flag: ChangeFlags): number {
    // read the current flag
    const value = this.changedFlags & flag;

    // Remove the current flag from the changedFlags
    this.removeChangeFlag(flag);

    return value;
  }

  /**
   * @override
   */
  public getChangeFlags(): number {
    return this.changedFlags;
  }

  /**
   * @override
   */
  public hasChangeFlags() {
    return Boolean(this.changedFlags);
  }

  /**
   * @override
   */
  public hasChangeFlag(flag: ChangeFlags) {
    return Boolean(this.changedFlags & flag);
  }

  /**
   * @override
   */
  public addChangeFlag(flag: ChangeFlags) {
    this.changedFlags |= flag;
  }

  /**
   * @override
   */
  public removeChangeFlag(flag: ChangeFlags, _deep?: boolean) {
    this.changedFlags &= ~flag;
  }

  public removeAllChangeFlags() {
    this.changedFlags = 0;
  }

  /**
   * @override
   */
  public fireChangeEvent(flag: ChangeFlags) {
    this.addChangeFlag(flag);
    this.updateObserver();
  }

  /**
   * @override
   */
  public fireContainerItemChanged(origin: Component) {
    this.parent?.fireContainerItemChanged(origin);
  }
}
