import BasicObserver from '../model/BasicObserver';
import CommandComponent from '../model/CommandComponent';
import Component from '../model/Component';

export default class DropdownMenuButton {
  private id: string;
  private component: CommandComponent;
  private htmlButton: HTMLButtonElement;
  private observer: BasicObserver;

  constructor(id: string, component: CommandComponent, closePopups = false) {
    this.id = id;
    this.component = component;
    this.htmlButton = document.getElementById(id) as HTMLButtonElement;

    if (!component || !this.htmlButton) {
      console.error('Button init failed for id: ' + id);
      return;
    }

    // set initial values
    this.setEnabled(this.component.isEnabled());
    this.setVisible(this.component.isVisible());

    // observe the component
    const _this = this;

    this.observer = new class extends BasicObserver {

      onEnabledChanged(_sender: Component<any>): void {
        _this.setEnabled(_this.component.isEnabled());
      }

      onVisibleChanged(_sender: Component<any>): void {
        _this.setVisible(_this.component?.isVisible());
      }
    }

    this.component.addObserver(this.observer);

    this.htmlButton.onclick = () => {
      if (closePopups) _this.closeDropdowns();
      _this.component.getValue().execute();
    };
  }

  protected setEnabled(enabled: boolean) {
    this.htmlButton.disabled = !enabled;
  }

  protected setVisible(visible: boolean) {
    this.htmlButton.style.display = visible ? 'block' : 'none';
  }

  public closeDropdowns() {
    const allDropdowns = document.getElementsByClassName('dropdown-content');
    for (const item of allDropdowns) {
      if (item instanceof HTMLElement) {
        item.style.display = 'none';
      }
    }
  }

}