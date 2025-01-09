import Button from "../../lib/gui/Button";
import Checkbox from "../../lib/gui/Checkbox";
import Label from "../../lib/gui/Label";
import Input from "../../lib/gui/Input";
import RangeControl from "../../lib/gui/RangeControl";
import BasicObserver from "../../lib/model/BasicObserver";
import Component from "../../lib/model/Component";
import MainModel from "../model/MainModel";

export default class MainSidebarPanel {
  private htmlMainSidebarPanel: HTMLDivElement;
  private showGridCheckbox: Checkbox;
  private showAxesCheckbox: Checkbox;
  private showBoundingBoxesCheckbox: Checkbox;
  private screenSpaceError: Input;
  private maximumMemoryUsage: Input;
  private maximumTilesSelected: Input;
  private reloadModelButton: Button;
  private tilesetStats: Input;
  private sidebarToggleObserver: BasicObserver;

  constructor() {
    this.initHTMLComponents();
    this.initComponents();
    this.initListener();
    this.initObserver();
  }

  public dispose() {
    // Implement me
  }

  private initHTMLComponents() {
    this.htmlMainSidebarPanel = document.getElementById('main_sidebar_panel') as HTMLDivElement;
  }

  private initComponents() {
    const model = MainModel.getInstance();

    this.showGridCheckbox = new Checkbox('show_grid', model.getShowGrid());
    this.showAxesCheckbox = new Checkbox('show_axes', model.getShowAxes());
    this.showBoundingBoxesCheckbox = new Checkbox('show_bounding_boxes', model.getShowBoundingBoxes());
    this.screenSpaceError = new Input('screen_space_error', model.getScreenSpaceError());
    this.maximumMemoryUsage = new Input('maximum_memory_usage', model.getMaximumMemoryUsage());
    this.maximumTilesSelected = new Input('maximum_tiles_selected', model.getMaximumTilesSelected());
    this.tilesetStats = new Input('sidebar_tileset_stats', model.getTilesetStats());
    this.reloadModelButton = new Button('reload_model', model.getReloadModelCommand());
  }

  private initListener() {
    // Implement me
  }

  private initObserver() {
    const model = MainModel.getInstance();

    const _this = this;

    this.sidebarToggleObserver = new class extends BasicObserver {
      onValueChanged(_sender: Component<any>): void {
        _this.setVisible(model.getSidebarToggleState().getValue());
      }
    };

    model.getSidebarToggleState().addObserver(this.sidebarToggleObserver);
  }

  public setVisible(visible: boolean) {
    this.htmlMainSidebarPanel.style.display = visible ? 'block' : 'none';
  }

  public isVisible(): boolean {
    return this.htmlMainSidebarPanel.style.display !== 'none';
  }
}