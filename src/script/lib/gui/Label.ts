import BasicObserver from '../model/BasicObserver';
import Component from '../model/Component';

export default class Checkbox {
  private id: string;
  private component: Component;
  private htmlLabel: HTMLElement;
  private observer: BasicObserver;

  constructor(id: string, component: Component) {
    this.id = id;
    this.component = component;
    this.htmlLabel = document.getElementById(id) as HTMLElement;

    if (!component || !this.htmlLabel) {
      console.error('Label init failed for id: ' + id);
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
  }

  protected setValue(value: string) {
    if (this.htmlLabel) {
      this.htmlLabel.innerHTML = value;
    }
  }

  protected setEnabled(enabled: boolean) {
    if (!enabled) {
      this.htmlLabel.classList.add('disabled');
    } else {
      this.htmlLabel.classList.remove('disabled');
    }
  }

  protected setVisible(visible: boolean) {
    this.htmlLabel.style.display = visible ? 'block' : 'none';
  }

}