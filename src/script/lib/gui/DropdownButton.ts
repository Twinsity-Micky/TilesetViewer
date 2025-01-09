import Component from "../model/Component";
import BasicObserver from '../model/BasicObserver';

export default class DropdownButton {
  private id: string;
  private component: Component;
  private dropdownId: string;
  private parentDropdownButton: DropdownButton;
  private childDropdownButton: DropdownButton;
  private rightAligned: boolean;
  private htmlButton: HTMLButtonElement;
  private htmlDropdown: HTMLDivElement;
  private observer: BasicObserver;

  constructor(id: string, component: Component, dropdownId: string, parentDropdownButton: DropdownButton = null, rightAligned = false) {
    this.id = id;
    this.component = component;
    this.dropdownId = dropdownId;
    this.parentDropdownButton = parentDropdownButton;
    this.rightAligned = rightAligned;
    this.htmlButton = document.getElementById(id) as HTMLButtonElement;
    this.htmlDropdown = document.getElementById(dropdownId) as HTMLDivElement;

    if (!this.htmlButton || !this.htmlDropdown) {
      console.error('DropdownButton init failed for id: ' + id + ' dropdownId: ' + dropdownId);
      return;
    }

    const _this = this;

    // set initial values
    if (component) {
      this.setEnabled(this.component.isEnabled());
      this.setVisible(this.component.isVisible());
      this.observer = new class extends BasicObserver {

        onEnabledChanged(_sender: Component<any>): void {
          _this.setEnabled(_this.component.isEnabled());
        }
  
        onVisibleChanged(_sender: Component<any>): void {
          _this.setVisible(_this.component?.isVisible());
        }
      }
  
      this.component.addObserver(this.observer);
    }

    // Toggle dropdown
    this.htmlButton.onclick = (event) => {
      _this.setSelected(!this.isSelected());
      event.preventDefault();
      event.stopPropagation();
    };

    // Close open dropdowns 
    const onClick = (event: MouseEvent) => {
      if (_this.isSelected()) {
        if (!_this.inDropdown(event)) {
          const force = _this.parentDropdownButton ? !_this.parentDropdownButton.inDropdown(event) : false;
          _this.closeDropdowns(force);
        }
      }

    };

    window.addEventListener('click', onClick);
  }

  protected inDropdown(event: MouseEvent): boolean {
    const cr = this.htmlDropdown.getBoundingClientRect();
    if (event.clientX < cr.left || event.clientX > cr.right || event.clientY < cr.top || event.clientY > cr.bottom) {
      return false;
    }
    return true;
  }

  protected setChildDropdownButton(childDropdownButton: DropdownButton) {
    this.childDropdownButton = childDropdownButton;
  }

  protected isSelected(): boolean {
    return this.htmlButton.classList.contains('selected');
  }

  protected setSelected(selected: boolean) {
    if (selected) {
      // Close other dropdowns first
      if (!this.parentDropdownButton) {
        this.closeDropdowns();
      }
      // Open this dropdown
      this.htmlButton.classList.add('selected');
      this.htmlDropdown.style.display = 'flex';
      // Set this as child if this has a parent
      if (this.parentDropdownButton) {
        this.parentDropdownButton.setChildDropdownButton(this);
        this.htmlDropdown.style.top = '0px';
        // Position the dropdowns if parent is right aligned
        if (this.rightAligned) {
          const rcDropdown = this.htmlDropdown.getBoundingClientRect();
          this.htmlDropdown.style.left = -rcDropdown.width + 'px';
        }
      }
    } else {
      this.htmlButton.classList.remove('selected');
      this.htmlDropdown.style.display = 'none';
      if (this.parentDropdownButton) {
        this.parentDropdownButton.setChildDropdownButton(null);
      }
    }
  }

  public closeDropdowns(force = false) {
    if (this.childDropdownButton?.isSelected()) return;

    if (!force && this.parentDropdownButton?.isSelected()) {
      this.setSelected(false);
      return;
    }

    const allDropdownButtons = document.getElementsByClassName('dropdown-button');
    for (const item of allDropdownButtons) {
      if (item instanceof HTMLElement) {
        item.classList.remove('selected');
      }
    }
    const allDropdowns = document.getElementsByClassName('dropdown-content');
    for (const item of allDropdowns) {
      if (item instanceof HTMLElement) {
        item.style.display = 'none';
      }
    }
  }

  protected setEnabled(enabled: boolean) {
    this.htmlButton.disabled = !enabled;
  }

  protected setVisible(visible: boolean) {
    this.htmlButton.style.display = visible ? 'block' : 'none';
  }

}