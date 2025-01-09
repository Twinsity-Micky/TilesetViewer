import WebGLCanvas from "./WebGLCanvas";
import MainToolbar from "./MainToolbar";
import MainSidebar from "./MainSidebar";
import i18next from '../../locales/i18n';
import BasicObserver from '../../lib/model/BasicObserver';
import MainModel from "../model/MainModel";
import Component from '../../lib/model/Component';

export default class MainView {
  private mainToolbar: MainToolbar;
  private mainSidebar: MainSidebar;
  private webGLCanvas: WebGLCanvas;

  private localeObserver: BasicObserver;

  constructor() {
    this.mainToolbar = new MainToolbar();
    this.mainSidebar = new MainSidebar();

    const model = MainModel.getInstance();
    this.webGLCanvas = new WebGLCanvas();

    this.initLocales();
    this.initObserver();

    document.body.classList.remove('no-transition');
  }

  public dispose() {
    this.mainToolbar?.dispose();
    this.mainSidebar?.dispose();
    this.webGLCanvas?.dispose();
  }

  private initLocales() {
    // Toolbar
    document.getElementById('hamburger_dropdown_button').title = i18next.t('TIP_TEXT.HAMBURGER_DROPDOWN');

    // Hamburger dropdown menu
    document.getElementById('locale_dropdown_button').innerHTML = i18next.t('HAMBURGER_DROPDOWN.LOCALE');
    document.getElementById('toggle_fullscreen_button').innerHTML = i18next.t('HAMBURGER_DROPDOWN.FULLSCREEN');
    document.getElementById('toggle_fullscreen_button').title = i18next.t('TIP_TEXT.TOGGLE_FULLSCREEN');
    document.getElementById('help_button').innerHTML = i18next.t('HAMBURGER_DROPDOWN.HELP');
    document.getElementById('about_button').innerHTML = i18next.t('HAMBURGER_DROPDOWN.ABOUT');

    // Sidebar
    document.getElementById('sidebar_toggle_button').title = i18next.t('TIP_TEXT.TOGGLE_SIDEBAR');

    // Popup buttons
    document.querySelectorAll('popup-ok-button').forEach(item => {
      item.innerHTML = i18next.t('GENERAL.OK');
    });
    document.querySelectorAll('popup-apply-button').forEach(item => {
      item.innerHTML = i18next.t('GENERAL.APPLY');
    });
    document.querySelectorAll('popup-cancel-button').forEach(item => {
      item.innerHTML = i18next.t('GENERAL.CANCEL');
    });
    document.querySelectorAll('popup-close-button').forEach(item => {
      item.innerHTML = i18next.t('GENERAL.CLOSE');
    });
    document.querySelectorAll('popup-yes-button').forEach(item => {
      item.innerHTML = i18next.t('GENERAL.YES');
    });
    document.querySelectorAll('popup-no-button').forEach(item => {
      item.innerHTML = i18next.t('GENERAL.NO');
    });
  } 

  private initObserver() {
    const model = MainModel.getInstance();
    const _this = this;

    this.localeObserver = new class extends BasicObserver {
      onValueChanged(_sender: Component<any>): void {
        i18next.changeLanguage(model.getLocale().getValue());
        _this.initLocales();
      }
    };

    model.getLocale().addObserver(this.localeObserver);

  }

}