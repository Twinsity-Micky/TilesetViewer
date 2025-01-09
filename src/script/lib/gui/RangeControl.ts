import BasicObserver from '../model/BasicObserver';
import NumberComponent from '../model/NumberComponent';
import Component from '../model/Component';

export default class RangeControl {
  private id: string;
  private component: NumberComponent;
  private immediately: boolean;
  private htmlRange: HTMLInputElement;
  private htmlLabelFor: HTMLLabelElement;
  private observer: BasicObserver;

  constructor(id: string, component: NumberComponent, immediately = true) {
    this.id = id;
    this.component = component;
    this.immediately = immediately;
    this.htmlRange = document.getElementById(id) as HTMLInputElement;
    this.htmlLabelFor = document.querySelector(`label[for="${id}"]`);

    if (!component || !this.htmlRange) {
      console.error('Range init failed for id: ' + id);
      return;
    }

    // set initial values
    this.setMinValue(String(this.component.getMinValue()));
    this.setMaxValue(String(this.component.getMaxValue()));
    this.setStep(String(this.component.getStep()));
    this.setValue(String(this.component.getValue()));
    this.setEnabled(this.component.isEnabled());
    this.setVisible(this.component.isVisible());

    // observe the component
    const _this = this;

    this.observer = new class extends BasicObserver {

      onValueChanged(_sender: Component<any>): void {
        _this.setValue(String(_this.component.getValue()));
      }

      onContainerItemChanged(_sender: Component<any>, _origin: Component<any>): void {
        _this.setMinValue(String(_this.component.getMinValue()));
        _this.setMaxValue(String(_this.component.getMaxValue()));
      }

      onEnabledChanged(_sender: Component<any>): void {
        _this.setEnabled(_this.component.isEnabled());
      }

      onVisibleChanged(_sender: Component<any>): void {
        _this.setVisible(_this.component?.isVisible());
      }
    }

    this.component.addObserver(this.observer);

    if (immediately) {
      this.htmlRange.oninput = () => {
        _this.component.setStringValue(_this.htmlRange.value, true);
      }
    } else {
      this.htmlRange.onchange = () => {
        _this.component.setStringValue(_this.htmlRange.value, true);
      }
    }
  }

  protected setMinValue(min: string) {
    this.htmlRange.min = min;
  }

  protected setMaxValue(max: string) {
    this.htmlRange.max = max;
  }

  protected setStep(step: string) {
    this.htmlRange.step = step;
  }

  protected setValue(value: string) {
    this.htmlRange.value = value;
  }

  protected setEnabled(enabled: boolean) {
    this.htmlRange.disabled = !enabled;
    if (!enabled) {
      this.htmlLabelFor?.classList.add('disabled');
    } else {
      this.htmlLabelFor?.classList.remove('disabled');
    }
  }

  protected setVisible(visible: boolean) {
    this.htmlRange.style.display = visible ? 'block' : 'none';
    if (this.htmlLabelFor) {
      this.htmlLabelFor.style.display = visible ? 'block' : 'none';
    }
  }
}