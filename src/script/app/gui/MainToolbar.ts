import Button from "../../lib/gui/Button";
import DropdownButton from "../..//lib/gui/DropdownButton";
import DropdownMenuButton from "../..//lib/gui/DropdownMenuButton";
import MainModel from "../model/MainModel";
import Input from '../../lib/gui/Input';
import Label from '../../lib/gui/Label';

export default class MainToolbar {
  private htmlMainToolbar: HTMLDivElement;

  private gardenButton: Button;
  private bridgeButton: Button;
  private factoryButton: Button;
  private streetButton: Button;
  private localGardenButton: Button;
  private localBridgeButton: Button;
  private localFactoryButton: Button;
  private localMetashapeContainerButton: Button;
  private localPix4DContainerButton: Button;
  private localRealityCaptureContainerButton: Button;
  private hamburgerDropdownButton: DropdownButton;
  private localeDropdownButton: DropdownButton;
  private locale_en_gb_Button: Button;
  private locale_de_de_Button: Button;
  private locale_browser_default_Button: Button;
  private toggleFullscreenButton: DropdownMenuButton;
  private helpButton: DropdownMenuButton;
  private aboutButton: DropdownMenuButton;

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
    this.htmlMainToolbar = document.getElementById('main_toolbar') as HTMLDivElement;
  }

  private initComponents() {
    const model = MainModel.getInstance();

    this.gardenButton = new Button('garden_sample_button', model.getGardenSampleCommand());
    this.bridgeButton = new Button('bridge_sample_button', model.getBridgeSampleCommand());
    this.factoryButton = new Button('factory_sample_button', model.getFactorySampleCommand());
    this.streetButton = new Button('street_sample_button', model.getStreetSampleCommand());
    this.localGardenButton = new Button('local_garden_sample_button', model.getLocalGardenSampleCommand());
    this.localBridgeButton = new Button('local_bridge_sample_button', model.getLocalBridgeSampleCommand());
    this.localFactoryButton = new Button('local_factory_sample_button', model.getLocalFactorySampleCommand());
    this.localMetashapeContainerButton = new Button('local_metashape_container_sample_button', model.getLocalMetashapeContainerSampleCommand());
    this.localPix4DContainerButton = new Button('local_pix4d_container_sample_button', model.getLocalPix4DContainerSampleCommand());
    this.localRealityCaptureContainerButton = new Button('local_realitycapture_container_sample_button', model.getLocalRealityCaptureContainerSampleCommand());

    this.hamburgerDropdownButton = new DropdownButton('hamburger_dropdown_button', null, 'hamburger_dropdown_content');
    this.localeDropdownButton = new DropdownButton('locale_dropdown_button', null, 'locale_dropdown_content', this.hamburgerDropdownButton, true);
    this.locale_en_gb_Button = new Button('locale_en_gb_button', model.getLocale_EN_GB_Command());
    this.locale_de_de_Button = new Button('locale_de_de_button', model.getLocale_DE_DE_Command());
    this.locale_browser_default_Button = new Button('locale_browser_default_button', model.getLocaleBrowserDefaultCommand());
    this.toggleFullscreenButton = new DropdownMenuButton('toggle_fullscreen_button', model.getToggleFullscreenCommand(), true);
    this.helpButton = new DropdownMenuButton('help_button', model.getHelpCommand(), true);
    this.aboutButton = new DropdownMenuButton('about_button', model.getAboutCommand(), true);
  }

  private initListener() {
    // Implement me
  }

  private initObserver() {
    // Implement me
  }

}