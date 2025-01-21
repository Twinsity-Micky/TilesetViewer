import BasicContainer from '../../lib/model/BasicContainer';
import CommandFactory from './CommandFactory';
import CommandComponent from '../../lib/model/CommandComponent';
import BooleanComponent from '../../lib/model/BooleanComponent';
import StringComponent from '../../lib/model/StringComponent';
import NumberComponent from '../../lib/model/NumberComponent';
import NumberFormatter from '../../lib/model/NumberFormatter';

export default class MainModel extends BasicContainer {
  public static readonly NAME = 'MainModel';
  public static readonly WINDOW_TITLE = 'WindowTitle';
  public static readonly GARDEN_SAMPLE_COMMAND = 'GardenSampleCommand';
  public static readonly BRIDGE_SAMPLE_COMMAND = 'BridgeSampleCommand';
  public static readonly FACTORY_SAMPLE_COMMAND = 'FactorySampleCommand';
  public static readonly STREET_SAMPLE_COMMAND = 'StreetSampleCommand';
  public static readonly LOCAL_GARDEN_SAMPLE_COMMAND = 'LocalGardenSampleCommand';
  public static readonly LOCAL_BRIDGE_SAMPLE_COMMAND = 'LocalBridgeSampleCommand';
  public static readonly LOCAL_FACTORY_SAMPLE_COMMAND = 'LocalFactorySampleCommand';
  public static readonly LOCAL_METASHAPE_CONTAINER_SAMPLE_COMMAND = 'LocalMetashapeContainerSampleCommand';
  public static readonly LOCAL_PIX4D_CONTAINER_SAMPLE_COMMAND = 'LocalPIX4DContainerSampleCommand';
  public static readonly LOCAL_REALITY_CAPTURE_CONTAINER_SAMPLE_COMMAND = 'LocalRealityCaptureContainerSampleCommand';
  public static readonly RELOAD_MODEL_COMMAND = 'ReloadModelCommand';
  public static readonly LOCALE_EN_GB_COMMAND = 'Locale_en_GB_Command';
  public static readonly LOCALE_DE_DE_COMMAND = 'Locale_de_DE_Command';
  public static readonly LOCALE_BROWSER_DEFAULT_COMMAND = 'LocaleBrowserDefaultCommand';
  public static readonly LOCALE = 'Locale';
  public static readonly CDN_PATH = 'CDNPath';

  public static readonly TOGGLE_FULLSCREEN_COMMAND = 'ToggleFullscreenCommand';
  public static readonly HELP_COMMAND = 'HelpCommand';
  public static readonly ABOUT_COMMAND = 'AboutCommand';

  public static readonly FULLSCREEN_TOGGLE_STATE = 'FullscreenToggleState';
  public static readonly SIDEBAR_TOGGLE_STATE = 'SidebarToggleState';

  public static readonly SHOW_GRID = 'ShowGrid';
  public static readonly SHOW_AXES = 'ShowAxes';
  public static readonly SHOW_BOUNDING_BOXES = 'ShowBoundingBoxes';
  public static readonly SCREEN_SPACE_ERROR = 'ScreenSpaceError';
  public static readonly MAXIMUM_MEMORY_USAGE = 'MaximumMemoryUsage';
  public static readonly MAXIMUM_TILES_SELECTED =  'MaximumTilesSelected';
  public static readonly TILESET_STATS = 'TilesetStats'

  private static instance: MainModel = null;

  /**
   * The one and only way to get the MainModel
   * 
   * @returns The one and only instance of the MainModel
   */
  public static getInstance() {
    if (!MainModel.instance) {
      MainModel.instance = new MainModel()
    }

    return MainModel.instance;
  }

  private constructor() {
    super(null, MainModel.NAME);

    this.initComponents();
    this.initDefaults();
  }

  private initComponents() {
    this.add(new StringComponent(this, MainModel.WINDOW_TITLE, 'Web-Application-Template'));
    this.add(new CommandComponent(this, MainModel.GARDEN_SAMPLE_COMMAND, CommandFactory.createGardenSampleCommand()));
    this.add(new CommandComponent(this, MainModel.BRIDGE_SAMPLE_COMMAND, CommandFactory.createBridgeSampleCommand()));
    this.add(new CommandComponent(this, MainModel.FACTORY_SAMPLE_COMMAND, CommandFactory.createFactorySampleCommand()));
    this.add(new CommandComponent(this, MainModel.STREET_SAMPLE_COMMAND, CommandFactory.createStreetSampleCommand()));
    this.add(new CommandComponent(this, MainModel.LOCAL_GARDEN_SAMPLE_COMMAND, CommandFactory.createLocalGardenSampleCommand()));
    this.add(new CommandComponent(this, MainModel.LOCAL_BRIDGE_SAMPLE_COMMAND, CommandFactory.createLocalBridgeSampleCommand()));
    this.add(new CommandComponent(this, MainModel.LOCAL_FACTORY_SAMPLE_COMMAND, CommandFactory.createLocalFactorySampleCommand()));
    this.add(new CommandComponent(this, MainModel.LOCAL_METASHAPE_CONTAINER_SAMPLE_COMMAND, CommandFactory.createLocalMetashapeContainerSampleCommand()));
    this.add(new CommandComponent(this, MainModel.LOCAL_PIX4D_CONTAINER_SAMPLE_COMMAND, CommandFactory.createLocalPix4DContainerSampleCommand()));
    this.add(new CommandComponent(this, MainModel.LOCAL_REALITY_CAPTURE_CONTAINER_SAMPLE_COMMAND, CommandFactory.createLocalRealityCaptureContainerSampleCommand()));
    this.add(new CommandComponent(this, MainModel.RELOAD_MODEL_COMMAND, CommandFactory.createReloadModelCommand()));
    this.add(new CommandComponent(this, MainModel.LOCALE_EN_GB_COMMAND, CommandFactory.createLocale_EN_GB_Command()));
    this.add(new CommandComponent(this, MainModel.LOCALE_DE_DE_COMMAND, CommandFactory.createLocale_DE_DE_Command()));
    this.add(new CommandComponent(this, MainModel.LOCALE_BROWSER_DEFAULT_COMMAND, CommandFactory.createLocaleBrowserDefaultCommand()));
    this.add(new StringComponent(this, MainModel.LOCALE));
    this.add(new StringComponent(this, MainModel.CDN_PATH));

    this.add(new CommandComponent(this, MainModel.TOGGLE_FULLSCREEN_COMMAND, CommandFactory.createToggleFullscreenCommand()));
    this.add(new CommandComponent(this, MainModel.HELP_COMMAND, CommandFactory.createHelpCommand()));
    this.add(new CommandComponent(this, MainModel.ABOUT_COMMAND, CommandFactory.createAboutCommand()));

    this.add(new BooleanComponent(this, MainModel.FULLSCREEN_TOGGLE_STATE, false));
    this.add(new BooleanComponent(this, MainModel.SIDEBAR_TOGGLE_STATE, false));

    this.add(new BooleanComponent(this, MainModel.SHOW_GRID, true));
    this.add(new BooleanComponent(this, MainModel.SHOW_AXES, true));
    this.add(new BooleanComponent(this, MainModel.SHOW_BOUNDING_BOXES, false));
    this.add(new NumberComponent(this, MainModel.SCREEN_SPACE_ERROR, 16.0));
    this.add(new NumberComponent(this, MainModel.MAXIMUM_MEMORY_USAGE, 1024.0));
    this.add(new NumberComponent(this, MainModel.MAXIMUM_TILES_SELECTED, 4096.0));
    this.add(new StringComponent(this, MainModel.TILESET_STATS));
  }

  private async initDefaults() {
    if (navigator.languages) {
      for (const language of navigator.languages) {
        if (language.includes('-')) {
          this.getLocale().setValue(language);
          break;
        }
      }
    } else {
      this.getLocale().setValue(navigator.language);    
    }

    this.getScreenSpaceError().setMinValue(0.1);
    this.getScreenSpaceError().setMaxValue(100);
    this.getScreenSpaceError().setFormatter(new NumberFormatter(2));

    this.getMaximumMemoryUsage().setMinValue(64);
    this.getMaximumMemoryUsage().setMaxValue(8192);
    this.getMaximumMemoryUsage().setFormatter(new NumberFormatter(0));

    this.getMaximumTilesSelected().setMinValue(64);
    this.getMaximumTilesSelected().setMaxValue(8192);
    this.getMaximumTilesSelected().setFormatter(new NumberFormatter(0));

    this.getTilesetStats().setEnabled(false);
  }

  public getWindowTitle() {
    return this.get(MainModel.WINDOW_TITLE) as StringComponent;
  }

  public getGardenSampleCommand(): CommandComponent {
    return this.get(MainModel.GARDEN_SAMPLE_COMMAND) as CommandComponent;
  }

  public getBridgeSampleCommand(): CommandComponent {
    return this.get(MainModel.BRIDGE_SAMPLE_COMMAND) as CommandComponent;
  }

  public getFactorySampleCommand(): CommandComponent {
    return this.get(MainModel.FACTORY_SAMPLE_COMMAND) as CommandComponent;
  }

  public getStreetSampleCommand(): CommandComponent {
    return this.get(MainModel.STREET_SAMPLE_COMMAND) as CommandComponent;
  }

  public getLocalGardenSampleCommand(): CommandComponent {
    return this.get(MainModel.LOCAL_GARDEN_SAMPLE_COMMAND) as CommandComponent;
  }

  public getLocalBridgeSampleCommand(): CommandComponent {
    return this.get(MainModel.LOCAL_BRIDGE_SAMPLE_COMMAND) as CommandComponent;
  }

  public getLocalFactorySampleCommand(): CommandComponent {
    return this.get(MainModel.LOCAL_FACTORY_SAMPLE_COMMAND) as CommandComponent;
  }

  public getLocalMetashapeContainerSampleCommand(): CommandComponent {
    return this.get(MainModel.LOCAL_METASHAPE_CONTAINER_SAMPLE_COMMAND) as CommandComponent;
  }

  public getLocalPix4DContainerSampleCommand(): CommandComponent {
    return this.get(MainModel.LOCAL_PIX4D_CONTAINER_SAMPLE_COMMAND) as CommandComponent;
  }

  public getLocalRealityCaptureContainerSampleCommand(): CommandComponent {
    return this.get(MainModel.LOCAL_REALITY_CAPTURE_CONTAINER_SAMPLE_COMMAND) as CommandComponent;
  }

  public getReloadModelCommand(): CommandComponent {
    return this.get(MainModel.RELOAD_MODEL_COMMAND) as CommandComponent;
  }

  public getLocale_EN_GB_Command(): CommandComponent {
    return this.get(MainModel.LOCALE_EN_GB_COMMAND) as CommandComponent;
  }

  public getLocale_DE_DE_Command(): CommandComponent {
    return this.get(MainModel.LOCALE_DE_DE_COMMAND) as CommandComponent;
  }

  public getLocaleBrowserDefaultCommand(): CommandComponent {
    return this.get(MainModel.LOCALE_BROWSER_DEFAULT_COMMAND) as CommandComponent;
  }

  public getLocale(): StringComponent {
    return this.get(MainModel.LOCALE) as StringComponent;
  }

  public getCDNPath(): StringComponent {
    return this.get(MainModel.CDN_PATH) as StringComponent;
  }

  public getToggleFullscreenCommand(): CommandComponent {
    return this.get(MainModel.TOGGLE_FULLSCREEN_COMMAND) as CommandComponent;
  }

  public getHelpCommand(): CommandComponent {
    return this.get(MainModel.HELP_COMMAND) as CommandComponent;
  }

  public getAboutCommand(): CommandComponent {
    return this.get(MainModel.ABOUT_COMMAND) as CommandComponent;
  }

  public getFullscreenToggleState(): BooleanComponent {
    return this.get(MainModel.FULLSCREEN_TOGGLE_STATE) as BooleanComponent;
  }

  public getSidebarToggleState(): BooleanComponent {
    return this.get(MainModel.SIDEBAR_TOGGLE_STATE) as BooleanComponent;
  }

  public getShowGrid(): BooleanComponent {
    return this.get(MainModel.SHOW_GRID) as BooleanComponent;
  }

  public getShowAxes(): BooleanComponent {
    return this.get(MainModel.SHOW_AXES) as BooleanComponent;
  }

  public getShowBoundingBoxes(): BooleanComponent {
    return this.get(MainModel.SHOW_BOUNDING_BOXES) as BooleanComponent;
  }

  public getScreenSpaceError(): NumberComponent {
    return this.get(MainModel.SCREEN_SPACE_ERROR) as NumberComponent;
  }

  public getMaximumMemoryUsage(): NumberComponent {
    return this.get(MainModel.MAXIMUM_MEMORY_USAGE) as NumberComponent;
  }

  public getMaximumTilesSelected(): NumberComponent {
    return this.get(MainModel.MAXIMUM_TILES_SELECTED) as NumberComponent;
  }

  public getTilesetStats(): StringComponent {
    return this.get(MainModel.TILESET_STATS) as StringComponent;
  }

}