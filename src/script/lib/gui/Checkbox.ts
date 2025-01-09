import BasicObserver from '../model/BasicObserver';
import BooleanComponent from '../model/BooleanComponent';
import Component from '../model/Component';

export default class Checkbox {
  private id: string;
  private component: BooleanComponent;
  private htmlCheckbox: HTMLInputElement;
  private htmlLabelFor: HTMLLabelElement;
  private observer: BasicObserver;

  constructor(id: string, component: BooleanComponent) {
    this.id = id;
    this.component = component;
    this.htmlCheckbox = document.getElementById(id) as HTMLInputElement;
    this.htmlLabelFor = document.querySelector(`label[for="${id}"]`);

    if (!component || !this.htmlCheckbox) {
      console.error('Checkbox init failed for id: ' + id);
      return;
    }

    // set initial values
    this.setValue(this.component.getValue());
    this.setEnabled(this.component.isEnabled());
    this.setVisible(this.component.isVisible());

    // observe the component
    const _this = this;

    this.observer = new class extends BasicObserver {

      onValueChanged(_sender: Component<any>): void {
        _this.setValue(_this.component.getValue());
      }

      onEnabledChanged(_sender: Component<any>): void {
        _this.setEnabled(_this.component.isEnabled());
      }

      onVisibleChanged(_sender: Component<any>): void {
        _this.setVisible(_this.component?.isVisible());
      }
    }

    this.component.addObserver(this.observer);

    this.htmlCheckbox.onchange = () => {
      _this.component.setValue(_this.htmlCheckbox.checked);
    }

    this.htmlLabelFor.onkeydown = (event) => {
      if ((event.code === 'Space') || (event.code === 'Enter')) {
        _this.component.setValue(!_this.htmlCheckbox.checked);
      }
    } 

  }

  protected setValue(value: boolean) {
    this.htmlCheckbox.checked = value;
  }

  protected setEnabled(enabled: boolean) {
    this.htmlCheckbox.disabled = !enabled;
  }

  protected setVisible(visible: boolean) {
    if (this.htmlLabelFor) {
      this.htmlLabelFor.style.display = visible ? 'block' : 'none';
    }
  }
}