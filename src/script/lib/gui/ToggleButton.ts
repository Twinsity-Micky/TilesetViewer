import BasicObserver from '../model/BasicObserver';
import BooleanComponent from '../model/BooleanComponent';
import Component from '../model/Component';

export default class Button {
  private id: string;
  private component: BooleanComponent;
  private htmlButton: HTMLButtonElement;
  private observer: BasicObserver;

  constructor(id: string, component: BooleanComponent) {
    this.id = id;
    this.component = component;
    this.htmlButton = document.getElementById(id) as HTMLButtonElement;

    if (!component || !this.htmlButton) {
      console.error('ToggleButton init failed for id: ' + id);
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

    this.htmlButton.onclick = () => {
      _this.component.setValue(!_this.component.getValue());

      _this.setValue(_this.component.getValue());
    };

  }

  protected setValue(value: boolean) {
    if (value) {
      this.htmlButton.classList.add('selected');
    } else {
      this.htmlButton.classList.remove('selected');
    }
  }

  protected setEnabled(enabled: boolean) {
    this.htmlButton.disabled = !enabled;
  }

  protected setVisible(visible: boolean) {
    this.htmlButton.style.display = visible ? 'block' : 'none';
  }

}