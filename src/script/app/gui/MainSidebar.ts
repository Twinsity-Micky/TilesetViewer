import ToggleButton from "../../lib/gui/ToggleButton";
import MainModel from "../model/MainModel";
import MainSidebarPanel from "./MainSidebarPanel";

export default class MainSidebar {
  private htmlMainSidebar: HTMLDivElement;
  private sidebarToggleButton: ToggleButton;
  private mainSidebarPanel: MainSidebarPanel;

  constructor() {
    this.initHTMLComponents();
    this.initComponents();
    this.initListener();
    this.initObserver();
  }

  public dispose() {
    this.mainSidebarPanel.dispose();
  }

  private initHTMLComponents() {
    this.htmlMainSidebar = document.getElementById('main_sidebar') as HTMLDivElement;
  }

  private initComponents() {
    const model = MainModel.getInstance();

    this.sidebarToggleButton = new ToggleButton('sidebar_toggle_button', model.getSidebarToggleState());
    this.mainSidebarPanel = new MainSidebarPanel();
  }

  private initListener() {
    // Implement me
  }

  private initObserver() {
    // Implement me
  }

}