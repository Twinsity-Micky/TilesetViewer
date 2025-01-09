import BasicObserver from '../model/BasicObserver';
import Component from '../model/Component';

export default class Input {
  private id: string;
  private component: Component;
  private htmlTextfield: HTMLInputElement;
  private htmlLabelFor: HTMLLabelElement;
  private observer: BasicObserver;

  constructor(id: string, component: Component) {
    this.id = id;
    this.component = component;
    this.htmlTextfield = document.getElementById(id) as HTMLInputElement;
    this.htmlLabelFor = document.querySelector(`label[for="${id}"]`);

    if (!component || !this.htmlTextfield) {
      console.error('Input init failed for id: ' + id);
      return;
    }


    // set initial values
    this.setValue(this.component.getStringValue());
    this.setEnabled(this.component.isEnabled());
    this.setVisible(this.component.isVisible());

    // observe the component
    const _this = this;

    this.observer = new class extends BasicObserver {

      onValueChanged(_sender: Component<any>): void {
        _this.setValue(_this.component.getStringValue());
      }

      onEnabledChanged(_sender: Component<any>): void {
        _this.setEnabled(_this.component.isEnabled());
      }

      onVisibleChanged(_sender: Component<any>): void {
        _this.setVisible(_this.component?.isVisible());
      }
    }

    this.component.addObserver(this.observer);

    // this.htmlTextfield.onkeyup = () => {
    //   _this.component.setStringValue(_this.htmlTextfield.value, false);
    // }

    this.htmlTextfield.onchange = () => {
      _this.component.setStringValue(_this.htmlTextfield.value, true);
      this.setValue(this.component.getStringValue());
    }

  }

  protected setValue(value: string) {
    this.htmlTextfield.value = value;
  }

  protected setEnabled(enabled: boolean) {
    this.htmlTextfield.disabled = !enabled;
    if (!enabled) {
      this.htmlLabelFor?.classList.add('disabled');
    } else {
      this.htmlLabelFor?.classList.remove('disabled');
    }
  }

  protected setVisible(visible: boolean) {
    this.htmlTextfield.style.display = visible ? 'block' : 'none';
    if (this.htmlLabelFor) {
      this.htmlLabelFor.style.display = visible ? 'block' : 'none';
    }
  }
}