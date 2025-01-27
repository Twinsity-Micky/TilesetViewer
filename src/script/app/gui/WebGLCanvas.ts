import {
  ArcRotateCamera,
  ArcRotateCameraPointersInput,
  AxesViewer,
  Color3,
  Color4,
  Engine,
  GroundMesh,
  HemisphericLight,
  Matrix,
  MeshBuilder,
  Scene,
  SceneLoader,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';

import debounce from 'lodash-es/debounce';
import MainModel from '../model/MainModel';
import TilesetObject from '../../lib/tileset/TilesetObject';
import BasicCommand from '../../lib/model/BasicCommand';
import { GridMaterial } from '@babylonjs/materials';
import BasicObserver from '../../lib/model/BasicObserver';
import Component from '../../lib/model/Component';
import { GLTFFileLoader } from '@babylonjs/loaders/glTF';

export default class WebGLCanvas {
  private htmlCanvasContainer: HTMLDivElement;
  private htmlCanvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private grid: GroundMesh;
  private axes: AxesViewer;
  private tilesetObject: TilesetObject;
  private isRenderLoopRunning = false;
  private lastCameraMatrix: Matrix = null;

  private canvasResizeObserver = new ResizeObserver(() => {
    this.onResize();
  });

  private resizeListener = () => {
    this.onResize();
  };

  private doubleClickListener = (event: PointerEvent) => {
    const pickInfo = this.scene.pick(event.offsetX, event.offsetY);
    if (pickInfo.hit) {
      this.camera.target = pickInfo.pickedPoint;
      console.log('--> pickedPoint: ', pickInfo.pickedPoint);
      let parentNode = pickInfo.pickedMesh.parent;
      while (parentNode.parent != null) {
        parentNode = parentNode.parent;
      }
      console.log('--> pickedMesh: ', parentNode?.id);
    }
  };

  private keyboardListener = (event: KeyboardEvent) => {
    console.log('--> key pressed: ', event.code);
  };

  public constructor() {
    this.htmlCanvasContainer = document.getElementById('main_canvas_container') as HTMLDivElement;
    this.htmlCanvas = document.getElementById('webgl_canvas') as HTMLCanvasElement;
    this.initEngine();
    this.initScene();
    this.initListeners();
    this.initObservers();
    this.initCommands();
  }

  public dispose() {
    this.canvasResizeObserver.disconnect();
    window.removeEventListener('resize', this.resizeListener);
    this.htmlCanvas.removeEventListener('dblclick', this.doubleClickListener);
    this.htmlCanvas.removeEventListener('keydown', this.keyboardListener);

    this.grid?.dispose();
    this.axes?.dispose();
    this.tilesetObject?.dispose();

    this.stopRenderLoop();
  }

  private async initEngine() {
    this.htmlCanvas.style.display = 'block';
    // Create the engine. The engine should not handle the context lost event, otherwise it may cause an error loop
    this.engine = new Engine(this.htmlCanvas, true, { doNotHandleContextLost: true });
    // We don't want the engine to handle the offline support. This is done by our code instead. Also saves some memory
    this.engine.enableOfflineSupport = false;

    if (!SceneLoader.IsPluginForExtensionAvailable('gltf')) {
      SceneLoader.RegisterPlugin(new GLTFFileLoader({ extensionOptions: { '.glb': { loadImages: false } } }));
    }
  }

  private async initScene() {
    // Create the scene
    this.scene = new Scene(this.engine);
    // this.scene.useRightHandedSystem = true;

    // Performance flags for the scene
    this.scene.skipPointerMovePicking = true; // Do not raise events on pointer move
    // HINT! AutoClear is needed
    // this.scene.autoClear = false; // Do not auto clear the background
    // this.scene.autoClearDepthAndStencil = false; // Depth and stencil, obviously
    // this.scene.setRenderingAutoClearDepthStencil(1, false, false, false);
    this.scene.clearColor = Color4.FromHexString('#202020');

    // This creates and positions a free camera (non-mesh)
    this.camera = new ArcRotateCamera('mainCamera', 3.76, 0.87, 20, new Vector3(0, 0, 0));
    this.camera.lowerRadiusLimit = 1;
    this.camera.upperRadiusLimit = 1000;
    this.camera.wheelPrecision = 200;
    this.camera.minZ = 0;
    this.camera.maxZ = 10000;

    // This targets the camera to scene origin
    this.camera.setPosition(new Vector3(20, 20, 20));
    this.camera.setTarget(Vector3.Zero());

    // This attaches the camera to the canvas
    this.camera.attachControl(this.htmlCanvas, true);

    // This creates a light, aiming 1,1,1 - to the sky (non-mesh)
    const light = new HemisphericLight('light', new Vector3(1, 1, 1), this.scene);

    // Our built-in 'ground' shape.
    const gridColor = Color3.FromHexString('#a0a0a0');
    const gridMaterial = new GridMaterial('gridMaterial', this.scene);

    gridMaterial.majorUnitFrequency = 10;
    gridMaterial.minorUnitVisibility = 0.7;
    gridMaterial.lineColor = gridColor;
    gridMaterial.backFaceCulling = false;
    gridMaterial.zOffset = 0.0;
    gridMaterial.opacity = 0.8;

    this.grid = MeshBuilder.CreateGround('grid', { width: 1000, height: 1000 }, this.scene);
    this.grid.position.y = 0;
    this.grid.material = gridMaterial;
    this.grid.isPickable = false;
    this.grid.setEnabled(MainModel.getInstance().getShowGrid().valueOf());

    this.axes = new AxesViewer(this.scene, 5);
    this.axes.update(Vector3.Zero(), new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1));

    const rect = this.htmlCanvasContainer.getBoundingClientRect();

    const projectUrl =
      window.location.search?.length > 1
        ? window.location.search.substring(1)
        // : 'https://3dtiles.twinspect.app/data/valdemorillo/tileset.json';
        // : 'https://int.nyt.com/data/3dscenes/ONA360/TILESET/0731_FREEMAN_ALLEY_10M_A_36x8K__10K-PN_50P_DB/tileset_tileset.json';
        : 'http://localhost:8080/COWI_bridge_11_geo/tileset.json';

    this.tilesetObject = new TilesetObject(this.scene, this.camera, rect.width - 2, rect.height - 2);

    try {
      await this.tilesetObject.load(projectUrl);
    } catch (err) {
      console.error('Exception loading tileset. Error: ', err);
    }

    this.scene.beforeRender = () => {
      this.beforeRender();
    };

    this.scene.afterRender = () => {
      this.afterRender();
    };

    // Initializing done. Restart the render loop
    this.startRenderLoop();
  }

  private async initListeners() {
    const _this = this;
    if (typeof window.ResizeObserver === 'function') {
      this.canvasResizeObserver.observe(this.htmlCanvasContainer);
    } else {
      window.addEventListener('resize', this.resizeListener);
    }
    this.htmlCanvas.addEventListener('dblclick', this.doubleClickListener);
    this.htmlCanvas.addEventListener('keydown', this.keyboardListener);
  }

  private initObservers() {
    const model = MainModel.getInstance();
    const _this = this;

    model.getShowGrid().addObserver(
      new (class extends BasicObserver {
        onValueChanged(_sender: Component<any>): void {
          _this.grid.setEnabled(model.getShowGrid().valueOf());
        }
      })()
    );
    model.getShowAxes().addObserver(
      new (class extends BasicObserver {
        onValueChanged(_sender: Component<any>): void {
          _this.axes.xAxis.setEnabled(model.getShowAxes().valueOf());
          _this.axes.yAxis.setEnabled(model.getShowAxes().valueOf());
          _this.axes.zAxis.setEnabled(model.getShowAxes().valueOf());
        }
      })()
    );
    model.getShowBoundingBoxes().addObserver(
      new (class extends BasicObserver {
        onValueChanged(_sender: Component<any>): void {
          _this.tilesetObject.updateShowBoundingBoxes();
        }
      })()
    );
    model.getScreenSpaceError().addObserver(
      new (class extends BasicObserver {
        onValueChanged(_sender: Component<any>): void {
          _this.tilesetObject.updateScreenSpaceError();
        }
      })()
    );
  }

  private initCommands() {
    const _this = this;
    const model = MainModel.getInstance();

    model.getGardenSampleCommand().setValue(
      new (class extends BasicCommand {
        async execute() {
            await _this.tilesetObject.load('https://3dtiles.twinspect.app/data/valdemorillo/tileset.json');
            // This targets the camera to scene origin
            _this.camera.setPosition(new Vector3(20, 20, 20));
            _this.camera.setTarget(Vector3.Zero());
          }
      })()
    );
    model.getBridgeSampleCommand().setValue(
      new (class extends BasicCommand {
        async execute() {
          await _this.tilesetObject.load('https://3dtiles.twinspect.app/data/COWI_bridge_11_geo/tileset.json');
          // This targets the camera to scene origin
          _this.camera.setPosition(new Vector3(20, 20, 20));
          _this.camera.setTarget(Vector3.Zero());
        }
      })()
    );
    model.getFactorySampleCommand().setValue(
      new (class extends BasicCommand {
        async execute() {
          await _this.tilesetObject.load('https://3dtiles.twinspect.app/data/phase_one_factory/tileset.json');
          // This targets the camera to scene origin
          _this.camera.setPosition(new Vector3(20, 20, 20));
          _this.camera.setTarget(Vector3.Zero());
        }
      })()
    );
    model.getStreetSampleCommand().setValue(
      new (class extends BasicCommand {
        async execute() {
          await _this.tilesetObject.load('https://int.nyt.com/data/3dscenes/ONA360/TILESET/0731_FREEMAN_ALLEY_10M_A_36x8K__10K-PN_50P_DB/tileset_tileset.json');
          // This targets the camera to scene origin
          _this.camera.setPosition(new Vector3(20, 20, 20));
          _this.camera.setTarget(Vector3.Zero());
        }
      })()
    );
    model.getLocalGardenSampleCommand().setValue(
      new (class extends BasicCommand {
        async execute() {
          await _this.tilesetObject.load('http://localhost:8080/Valdemorillo/tileset.json');
          // This targets the camera to scene origin
          _this.camera.setPosition(new Vector3(20, 20, 20));
          _this.camera.setTarget(Vector3.Zero());
        }
      })()
    );
    model.getLocalBridgeSampleCommand().setValue(
      new (class extends BasicCommand {
        async execute() {
          await _this.tilesetObject.load('http://localhost:8080/COWI_bridge_11_geo/tileset.json');
          // This targets the camera to scene origin
          _this.camera.setPosition(new Vector3(20, 20, 20));
          _this.camera.setTarget(Vector3.Zero());
        }
      })()
    );
    model.getLocalFactorySampleCommand().setValue(
      new (class extends BasicCommand {
        async execute() {
          await _this.tilesetObject.load('http://localhost:8080/PhaseOne/tileset.json');
          // This targets the camera to scene origin
          _this.camera.setPosition(new Vector3(20, 20, 20));
          _this.camera.setTarget(Vector3.Zero());
        }
      })()
    );
    model.getLocalMetashapeContainerSampleCommand().setValue(
      new (class extends BasicCommand {
        async execute() {
          await _this.tilesetObject.load('http://localhost:8080/MetaShape_Container/tileset.json');
          // This targets the camera to scene origin
          _this.camera.setPosition(new Vector3(20, 20, 20));
          _this.camera.setTarget(Vector3.Zero());
        }
      })()
    );
    model.getLocalPix4DContainerSampleCommand().setValue(
      new (class extends BasicCommand {
        async execute() {
          await _this.tilesetObject.load('http://localhost:8080/Pix4D_Container/rainbow_containers/Rainbow_containers-cesium_mesh/tileset.json');
          // This targets the camera to scene origin
          _this.camera.setPosition(new Vector3(20, 20, 20));
          _this.camera.setTarget(Vector3.Zero());
        }
      })()
    );
    model.getLocalRealityCaptureContainerSampleCommand().setValue(
      new (class extends BasicCommand {
        async execute() {
          await _this.tilesetObject.load('http://localhost:8080/RealityCapture_Container/3Dtiles/tileset.json');
          // This targets the camera to scene origin
          _this.camera.setPosition(new Vector3(20, 20, 20));
          _this.camera.setTarget(Vector3.Zero());
        }
      })()
    );
    model.getReloadModelCommand().setValue(
      new (class extends BasicCommand {
        async execute() {
          await _this.tilesetObject.reload();
        }
      })()
    );
  }

  // Debounced to avoid flickering while sizing
  private onResize = debounce(() => {
    const rect = this.htmlCanvasContainer?.getBoundingClientRect();
    this.tilesetObject?.setViewDimension(rect.width - 2, rect.height - 2);
    this.engine?.resize();
  }, 50);

  private beforeRender() {
    // Things that must be done before the next frame is rendered

    const pointers = this.camera.inputs.attached.pointers as ArcRotateCameraPointersInput;

    if (pointers) {
      // distance-adjusted panning sensibility
      pointers.panningSensibility = 11 / (this.camera.radius / this.camera.upperRadiusLimit);
      this.camera.wheelPrecision = 5e5 / this.camera.radius / this.camera.upperRadiusLimit;
    }

    if (
      (Math.abs(this.camera.inertialAlphaOffset) > 0.0) ||
      (Math.abs(this.camera.inertialBetaOffset) > 0.0) ||
      (Math.abs(this.camera.inertialRadiusOffset) > 0.0) ||
      (this.lastCameraMatrix && this.lastCameraMatrix.equalsWithEpsilon(this.camera.getWorldMatrix(), 0.01))
    ) {
      return;
    }

    this.lastCameraMatrix = this.camera.getWorldMatrix().clone();

    this.tilesetObject?.update();
  }

  private afterRender() {
    // Things that must be done after a frame is rendered
  }

  private startRenderLoop() {
    if (!this.engine || !this.scene || !this.scene.activeCamera || this.isRenderLoopRunning) return;
    this.isRenderLoopRunning = true;
    // Run the render loop.
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  private stopRenderLoop() {
    if (this.isRenderLoopRunning) {
      this.isRenderLoopRunning = false;
      this.engine?.stopRenderLoop();
    }
  }
}
