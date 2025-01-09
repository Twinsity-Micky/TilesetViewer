import i18next from '../../locales/i18n';

export enum PopupType {
  POPUP,
  WINDOW,
}

export enum PopupOptions {
  NONE,
  OK,
  APPLY,
  CLOSE,
  OK_CANCEL,
  OK_CLOSE,
  APPLY_CLOSE,
  YES_NO,
  YES_NO_CANCEL,
  YES_NO_CLOSE,
}

export enum PopupCommand {
  OK,
  APPLY,
  CANCEL,
  CLOSE,
  YES,
  NO
}

export enum MessageBoxType {
  INFO,
  WARNING,
  ERROR
}

export default class Popup {
  private static openPopupCount = 0;

  private name: string;
  private modal: boolean;
  private type: PopupType;
  private title: string;
  private htmlContent: HTMLDivElement;
  private options: PopupOptions;
  private canCloseCallback: () => boolean;
  private commandCallback: (command: PopupCommand) => void;

  private htmlGlasspane: HTMLDivElement;
  private htmlPopup: HTMLDivElement;
  private htmlTitlebar: HTMLDivElement;
  private htmlTitle: HTMLDivElement;
  private htmlCloser: HTMLButtonElement;

  private htmlContentContainer: HTMLDivElement;
  private htmlButtonBar: HTMLDivElement;
  private htmlOkButton: HTMLButtonElement;
  private htmlApplyButton: HTMLButtonElement;
  private htmlCancelButton: HTMLButtonElement;
  private htmlCloseButton: HTMLButtonElement;
  private htmlYesButton: HTMLButtonElement;
  private htmlNoButton: HTMLButtonElement;

  private isPopupOpen = false;
  private isDragging = false;
  private clientRect: DOMRect;
  private xOffs = 0;
  private yOffs = 0;

  private onCloserClicked: () => void;
  private onPointerDown: (event: PointerEvent) => void;
  private onPointerMove: (event: PointerEvent) => void;
  private onPointerUp: (event: PointerEvent) => void;

  constructor(
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    modal: boolean,
    type: PopupType,
    title: string,
    htmlContent: HTMLDivElement,
    options: PopupOptions,
    enableCloser = true,
    z = 0
  ) {
    this.name = name;
    this.modal = modal;
    this.type = type;
    this.title = title;
    this.htmlContent = htmlContent;
    this.options = options;

    let zIndex = 10 + 2 * Popup.openPopupCount + z;

    if (modal) {
      this.htmlGlasspane = document.createElement('div');
      this.htmlGlasspane.classList.add('glasspane');
      this.htmlGlasspane.style.zIndex = zIndex.toFixed();
      zIndex++;
    }

    this.htmlPopup = document.createElement('div');
    this.htmlPopup.classList.add('popup');
    this.htmlPopup.classList.add('vbox');
    this.htmlPopup.style.zIndex = zIndex.toFixed();

    if (type === PopupType.POPUP) {
      this.htmlContent = document.createElement('div');
      this.htmlContent.classList.add('popup-content');
      this.htmlContent.classList.add('center');

      this.htmlPopup.appendChild(this.htmlContent);
    } else {
      this.htmlTitlebar = document.createElement('div');
      this.htmlTitlebar.classList.add('popup-titlebar');
      this.htmlTitlebar.classList.add('north');
      this.htmlTitlebar.classList.add('hbox');

      this.htmlTitle = document.createElement('div');
      this.htmlTitle.classList.add('popup-title');
      this.htmlTitle.classList.add('west');
      this.htmlTitle.innerHTML = this.title;

      this.htmlTitlebar.appendChild(this.htmlTitle);

      if (enableCloser) {
        this.htmlCloser = document.createElement('button') as HTMLButtonElement;
        this.htmlCloser.classList.add('popup-closer');
        this.htmlCloser.classList.add('east');
        this.htmlCloser.innerHTML='&#x2716;';
        this.htmlTitlebar.appendChild(this.htmlCloser);
      }

      this.htmlContentContainer = document.createElement('div');
      this.htmlContentContainer.classList.add('popup-content-container');
      this.htmlContentContainer.classList.add('center');
      this.htmlContentContainer.classList.add('vbox');

      this.htmlContent.classList.add('popup-content');
      this.htmlContent.classList.add('center');

      this.htmlButtonBar = document.createElement('div');
      this.htmlButtonBar.classList.add('popup-buttonbar');
      this.htmlButtonBar.classList.add('south');

      if (this.options === PopupOptions.OK || this.options === PopupOptions.OK_CANCEL || this.options === PopupOptions.OK_CLOSE) {
        this.htmlOkButton = document.createElement('button');
        this.htmlOkButton.classList.add('popup-ok-button');
        this.htmlOkButton.innerHTML = i18next.t('GENERAL.OK');
        this.htmlOkButton.onclick = () => {if (this.commandCallback) this.commandCallback(PopupCommand.OK); }
        this.htmlButtonBar.appendChild(this.htmlOkButton);
      }

      if (this.options === PopupOptions.APPLY || this.options === PopupOptions.APPLY_CLOSE) {
        this.htmlApplyButton = document.createElement('button');
        this.htmlApplyButton.classList.add('popup-apply-button');
        this.htmlApplyButton.innerHTML = i18next.t('GENERAL.APPLY');
        this.htmlApplyButton.onclick = () => {
          if (this.commandCallback) this.commandCallback(PopupCommand.APPLY); 
        }
        this.htmlButtonBar.appendChild(this.htmlApplyButton);
      }

      if (this.options === PopupOptions.YES_NO || this.options === PopupOptions.YES_NO_CANCEL || this.options === PopupOptions.YES_NO_CLOSE) {
        this.htmlYesButton = document.createElement('button');
        this.htmlYesButton.classList.add('popup-yes-button');
        this.htmlYesButton.innerHTML = i18next.t('GENERAL.YES');
        this.htmlYesButton.onclick = () => {if (this.commandCallback) this.commandCallback(PopupCommand.YES); }
        this.htmlButtonBar.appendChild(this.htmlYesButton);
      }

      if (this.options === PopupOptions.YES_NO || this.options === PopupOptions.YES_NO_CANCEL || this.options === PopupOptions.YES_NO_CLOSE) {
        this.htmlNoButton = document.createElement('button');
        this.htmlNoButton.classList.add('popup-no-button');
        this.htmlNoButton.innerHTML = i18next.t('GENERAL.NO');
        this.htmlNoButton.onclick = () => {if (this.commandCallback) this.commandCallback(PopupCommand.NO); }
        this.htmlButtonBar.appendChild(this.htmlNoButton);
      }

      if (this.options === PopupOptions.OK_CANCEL || this.options === PopupOptions.YES_NO_CANCEL) {
        this.htmlCancelButton = document.createElement('button');
        this.htmlCancelButton.classList.add('popup-cancel-button');
        this.htmlCancelButton.innerHTML = i18next.t('GENERAL.CANCEL');
        this.htmlCancelButton.onclick = () => {if (this.commandCallback) this.commandCallback(PopupCommand.CANCEL); }
        this.htmlButtonBar.appendChild(this.htmlCancelButton);
      }

      if (this.options === PopupOptions.OK_CLOSE || this.options === PopupOptions.APPLY_CLOSE || this.options === PopupOptions.YES_NO_CLOSE) {
        this.htmlCloseButton = document.createElement('button');
        this.htmlCloseButton.classList.add('popup-close-button');
        this.htmlCloseButton.innerHTML = i18next.t('GENERAL.CLOSE');
        this.htmlCloseButton.onclick = () => {if (this.commandCallback) this.commandCallback(PopupCommand.CLOSE); }
        this.htmlButtonBar.appendChild(this.htmlCloseButton);
      }

      this.htmlContentContainer.appendChild(this.htmlContent);
      this.htmlContentContainer.appendChild(this.htmlButtonBar);

      this.htmlPopup.appendChild(this.htmlTitlebar);
      this.htmlPopup.appendChild(this.htmlContentContainer);
    }

    if (this.htmlPopup) {
      this.htmlPopup.style.left = x + 'px';
      this.htmlPopup.style.top = y + 'px';
      this.htmlPopup.style.width = w + 'px';
      this.htmlPopup.style.height = h + 'px';
    }

    const _this = this;

    this.onCloserClicked = () => {
      if (!_this.canCloseCallback || this.canCloseCallback()) {
        _this.close();
      }
    }

    this.onPointerDown = (event: PointerEvent) => {
      this.isDragging = true;
      this.clientRect = this.htmlPopup.getBoundingClientRect();
      this.xOffs = event.clientX - this.clientRect.x;
      this.yOffs = event.clientY - this.clientRect.y;
    }

    this.onPointerMove = (event: PointerEvent) => {
      if (this.isDragging) {
        const x = event.clientX - this.xOffs;
        const y = event.clientY - this.yOffs;
        _this.setPosition(x, y);
      }
    }
    this.onPointerUp = (_event: PointerEvent) => {
      this.isDragging = false;
    }
  }

  setCanCloseCallback(canCloseCallback: () => boolean) {
    this.canCloseCallback = canCloseCallback;
  }

  setCommandCallback(commandCallback: (command: PopupCommand) => void) {
    this.commandCallback = commandCallback;
  }

  public open() {
    if (this.isPopupOpen) {
      return;
    }
    this.isPopupOpen = true;
    Popup.openPopupCount++;
    if (this.htmlGlasspane) {
      document.body.appendChild(this.htmlGlasspane);
    }
    if (this.htmlPopup) {
      document.body.appendChild(this.htmlPopup);
    }
    if (this.htmlTitlebar) {
      this.htmlTitlebar.addEventListener('pointerdown', this.onPointerDown);
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
    }

    const _this = this;
    if (this.htmlCloser) {
      this.htmlCloser.addEventListener('click', this.onCloserClicked);
    }
    this.setVisible(true);
  }

  public isOpen(): boolean {
    return this.isPopupOpen;
  }

  /**
   * Try to close the popup.
   * 
   * @returns boolean true if {@link canCloseCallback} returns true or is not defined
   */
  public close() {
    if (!this.isPopupOpen) {
      return true;
    }
    this.isPopupOpen = false;
    Popup.openPopupCount--;

    if (this.htmlTitlebar) {
      this.htmlTitlebar.removeEventListener('pointerdown', this.onPointerDown);
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
    }
    if (this.htmlCloser) {
      this.htmlCloser.removeEventListener('click', this.onCloserClicked);
    }

    this.htmlPopup?.remove();
    this.htmlGlasspane?.remove();

    // if dialog is stacked with another dialog we try to focus the first component of that dialog
    // if ($('.focusFirst')) {
    //   $('.focusFirst').trigger('focus');
    // }
  }

  public setVisible(visible: boolean) {
    if (visible) {
      if (this.htmlGlasspane) {
        this.htmlGlasspane.style.display = 'block';
      }
      if (this.htmlPopup) {
        this.htmlPopup.style.display = 'block';
      }
    } else {
      if (this.htmlGlasspane) {
        this.htmlGlasspane.style.display = 'none';
      }
      if (this.htmlPopup) {
        this.htmlPopup.style.display = 'none';
      }
    }
  }

  public isVisible(): boolean {
    return this.htmlPopup.style.display !== 'none';
  }

  public center() {
    const x = (document.body.clientWidth - this.htmlPopup.clientWidth) / 2;
    const y = (document.body.clientHeight - this.htmlPopup.clientHeight) / 2;
    this.htmlPopup.style.left = x + 'px';
    this.htmlPopup.style.top = y + 'px';
  }

  public setPosition(x: number, y: number) {
    const maxX = window.innerWidth - this.clientRect.width;
    const maxY = window.innerHeight - this.clientRect.height;
    const px = Math.max(0, Math.min(maxX, x));
    const py = Math.max(40, Math.min(maxY, y));
    this.htmlPopup.style.left = px + 'px';
    this.htmlPopup.style.top = py + 'px';
  }
}

export const showMessageBox = (type: MessageBoxType, message: string, width = 400, height = 130): Popup => {
  const htmlContent = document.createElement('div');
  htmlContent.classList.add('message-box-content');
  htmlContent.classList.add('hbox');
  
  const htmlIcon = document.createElement('div');
  htmlIcon.classList.add('west');
  
  const htmlMessage = document.createElement('div');
  htmlMessage.classList.add('message-box-message')
  htmlMessage.classList.add('center')
  htmlMessage.innerHTML = message;

  let title = '';
  switch (type) {
    case MessageBoxType.INFO: 
      htmlIcon.classList.add('message-box-icon-info'); 
      title = i18next.t('GENERAL.INFORMATION');
      break;
    case MessageBoxType.WARNING: 
      htmlIcon.classList.add('message-box-icon-warning'); 
      title = i18next.t('GENERAL.WARNING');
      break;      
    case MessageBoxType.ERROR: 
      htmlIcon.classList.add('message-box-icon-error'); 
      title = i18next.t('GENERAL.ERROR');
      break;
  }

  htmlContent.appendChild(htmlIcon);
  htmlContent.appendChild(htmlMessage);

  const popup = new Popup('MessageBox', 0, 0, width, height, true, PopupType.WINDOW, title, htmlContent, PopupOptions.OK);
  popup.setCommandCallback((_command: PopupCommand) => {
    popup.close();
  });
  popup.open();
  popup.center();
  return popup;
}

export const showQuestionBox = (question: string, commandCallback: (command: PopupCommand) => void, width = 400, height = 130): Popup => {
  const htmlContent = document.createElement('div');
  htmlContent.classList.add('message-box-content');
  htmlContent.classList.add('hbox');
  
  const htmlIcon = document.createElement('div');
  htmlIcon.classList.add('west');
  htmlIcon.classList.add('message-box-icon-question'); 
  
  const htmlMessage = document.createElement('div');
  htmlMessage.classList.add('message-box-message')
  htmlMessage.classList.add('center')
  htmlMessage.innerHTML = question;

  const title = i18next.t('GENERAL.QUESTION');

  htmlContent.appendChild(htmlIcon);
  htmlContent.appendChild(htmlMessage);

  const popup = new Popup('QuestionBox', 0, 0, width, height, true, PopupType.WINDOW, title, htmlContent, PopupOptions.YES_NO, false);
  popup.setCommandCallback(commandCallback);
  popup.open();
  popup.center();

  return popup;
}

export const showPromptBox = (label: string, defaultValue: string, callback: (value: string) => void, width = 320, height = 150): Popup => {
  const htmlContent = document.createElement('div');
  htmlContent.classList.add('message-box-content');
  htmlContent.classList.add('vbox');
  
  const htmlLabel = document.createElement('label');
  htmlLabel.classList.add('north');
  htmlLabel.classList.add('prompt-box-label');
  htmlLabel.innerHTML = label;
  const htmlInput = document.createElement('input') as HTMLInputElement;
  htmlInput.classList.add('center');
  htmlInput.classList.add('prompt-box-input');
  htmlInput.setAttribute('type', 'text');
  htmlInput.value = defaultValue;

  const title = '';//i18next.t('GENERAL.PROMPT');

  htmlContent.appendChild(htmlLabel);
  htmlContent.appendChild(htmlInput);

  const popup = new Popup('QuestionBox', 0, 0, width, height, true, PopupType.WINDOW, title, htmlContent, PopupOptions.OK_CANCEL);
  popup.setCanCloseCallback(() => {
    callback(null);
    return true;    
  });
  popup.setCommandCallback((command: PopupCommand) => {
    callback(command === PopupCommand.OK ? htmlInput.value : null);
    popup.close();
  });
  popup.open();
  popup.center();

  return popup;
}