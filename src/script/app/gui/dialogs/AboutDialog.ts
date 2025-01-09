import i18next from '../../../locales/i18n';
import Popup, { PopupType, PopupOptions, PopupCommand } from '../../../lib/gui/Popup';

export default class AboutDialog {

  constructor() {
    //
  }

  public open() {
    const popup = new Popup(
      'AboutDialog', 
      0, 0, 800, 480, 
      true, 
      PopupType.WINDOW, 
      i18next.t('ABOUT_DIALOG.TITLE'), 
      this.createContent(), 
      PopupOptions.OK
    );
    popup.setCommandCallback((_command: PopupCommand) => {
      popup.close();
    });
    popup.open();
    popup.center();
  }

  private createContent(): HTMLDivElement {
    const htmlContent = document.createElement('div');
    htmlContent.setAttribute('id', 'about_content');

    const applicationText = document.createElement('div');
    applicationText.innerHTML = 'Twinsity Tileset Viewer';
    applicationText.setAttribute('id', 'about_application_text');

    const copyrightText = document.createElement('div');
    copyrightText.innerHTML = '&copy; 2024 and later by Twinsity GmbH';
    copyrightText.setAttribute('id', 'about_copyright_text');
    htmlContent.appendChild(applicationText);
    htmlContent.appendChild(copyrightText);
    
    return htmlContent;
  }

}