import BasicCommand from '../../lib/model/BasicCommand';
import Command from '../../lib/model/Command';
import AboutDialog from '../gui/dialogs/AboutDialog';
import MainModel from './MainModel';

export default class CommandFactory {

  public static createGardenSampleCommand(): Command {
    return new BasicCommand('GardenSampleCommand');
  }

  public static createBridgeSampleCommand(): Command {
    return new BasicCommand('BridgeSampleCommand');
  }

  public static createFactorySampleCommand(): Command {
    return new BasicCommand('FactorySampleCommand');
  }

  public static createStreetSampleCommand(): Command {
    return new BasicCommand('FactorySampleCommand');
  }

  public static createLocalGardenSampleCommand(): Command {
    return new BasicCommand('LocalGardenSampleCommand');
  }

  public static createLocalFactorySampleCommand(): Command {
    return new BasicCommand('LocalFactorySampleCommand');
  }

  public static createLocalBridgeSampleCommand(): Command {
    return new BasicCommand('LocalBridgeSampleCommand');
  }

  public static createLocalMetashapeContainerSampleCommand(): Command {
    return new BasicCommand('LocalMetashapeContainerSampleCommand');
  }

  public static createLocalPix4DContainerSampleCommand(): Command {
    return new BasicCommand('LocalPix4DContainerSampleCommand');
  }

  public static createLocalRealityCaptureContainerSampleCommand(): Command {
    return new BasicCommand('LocalRealityCaptureContainerSampleCommand');
  }

  public static createReloadModelCommand(): Command {
    return new BasicCommand('ReloadModelCommand');
  }

  public static createLocale_EN_GB_Command(): Command {
    return new class extends BasicCommand {
      execute(): void {
        MainModel.getInstance().getLocale().setValue('en-GB');
      }
    }
  }

  public static createLocale_DE_DE_Command(): Command {
    return new class extends BasicCommand {
      execute(): void {
        MainModel.getInstance().getLocale().setValue('de-DE');
      }
    }
  }

  public static createLocaleBrowserDefaultCommand(): Command {
    return new class extends BasicCommand {
      execute(): void {
        if (navigator.languages) {
          for (const language of navigator.languages) {
            if (language.includes('-')) {
              MainModel.getInstance().getLocale().setValue(language);
              break;
            }
          }
        } else {
          MainModel.getInstance().getLocale().setValue(navigator.language);
        }
      }
    }
  }

  public static createToggleFullscreenCommand(): Command {
    return new class extends BasicCommand {
      execute(): void {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen()
        }
      }
    }
  }

  public static createHelpCommand(): Command {
    return new BasicCommand('HelpCommand');
  }

  public static createAboutCommand(): Command {
    return new (class extends BasicCommand {
      execute() {
        const dlg = new AboutDialog();
        dlg.open();
      }
    })();
  }

  public static createSampleCommand(): Command {
    return new class extends BasicCommand {
      execute(): void {
        window.alert('Execute Sample Command');
      }
    }
  }

}

