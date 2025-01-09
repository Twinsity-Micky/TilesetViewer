import { ArcRotateCamera, Scene, Vector3, Matrix, Tools, AssetContainer, SceneLoader, Mesh } from '@babylonjs/core';
import FirstPersonViewport, { FirstPersonViewportOptions } from '@deck.gl/core/dist/viewports/first-person-viewport';
import { Tiles3DLoader, Tiles3DLoaderOptions, Tiles3DTilesetJSONPostprocessed } from '@loaders.gl/3d-tiles';
import { load, LoaderOptions } from '@loaders.gl/core';
import { Tileset3D, Tile3D, TILE_CONTENT_STATE, TILE_TYPE } from '@loaders.gl/tiles';
import { Vector3 as MathGLVector3 } from '@math.gl/core';
import MainModel from '../../app/model/MainModel';

interface TileItem {
  asset: AssetContainer;
  assetRoot: Mesh;
}

export default class TilesetObject {
  private scene: Scene;
  private camera: ArcRotateCamera;
  private viewWidth: number;
  private viewHeight: number;
  private tilesetURL: string;
  private tilesetJson: Tiles3DTilesetJSONPostprocessed;
  private tileset: Tileset3D;

  private tileMap: Map<string, TileItem> = new Map();
  private tileUnloadQueue = [];

  private lastFrameState = -1;
  private loadInProgress = false;

  constructor(scene: Scene, camera: ArcRotateCamera, w: number, h: number) {
    this.scene = scene;
    this.camera = camera;
    this.viewWidth = w;
    this.viewHeight = h;
  }

  public dispose() {
    this.destroy();
  }

  private destroy() {
    this.tileMap?.values().forEach(tileItem => {
      tileItem.asset.dispose();
      tileItem.assetRoot.dispose();
    });
    this.tileMap?.clear();
    this.tileUnloadQueue = [];
    this.tileset?.destroy();
    this.tileset = null;
  }

  public async load(url: string) {
    console.log('--> load: ', url);
    this.loadInProgress = true;
    setTimeout(() => {
      this.doLoad(url);
    }, 100);
    this.loadInProgress = false;
  }

  private async doLoad(url: string) {
    this.destroy();

    const _this = this;
    this.tilesetURL = url;   

    let credentials: RequestCredentials = 'include';
    if (url.startsWith('http://localhost') || url.indexOf('0731_FREEMAN_ALLEY_10M_A_36x8K__10K-PN_50P_DB') > 0) {
      credentials = 'omit';
    }

    // @see https://forum.babylonjs.com/t/importing-gltf-arraybuffers-from-loaders-gl/31581/9
    const loadOptions: LoaderOptions & Tiles3DLoaderOptions = {
      // maxConcurrency: 10,
      // gltf: {
      //   decompressMeshes: false,
      //   postProcess: false,
      //   //   loadImages: false,
      // },
      '3d-tiles': {
        loadGLTF: false,
      },
      fetch: {
        credentials,
      },
    };

    this.tilesetJson = await load(url, Tiles3DLoader, loadOptions);

    console.log(this.tilesetJson);

    const model =  MainModel.getInstance();
    const sse = Math.max(1.0, Math.min(16, this.tilesetJson.lodMetricValue));
    const maximumMemoryUsage = model.getMaximumMemoryUsage().getValue();
    const maximumTilesSelected = model.getMaximumTilesSelected().getValue();

    this.tileset = new Tileset3D(this.tilesetJson, {
      updateTransforms: true,
      // copied from https://github.com/nytimes/three-loader-3dtiles/blob/3e876c9d26309e45e6e11e0092d62bb613af2127/src/index.ts#L260
      loadOptions,
      // memoryCacheOverflow: 0.1,
      debounceTime: 10,
      viewDistanceScale: 1, // Load x more/less tiles in the current view than what loaders.gl would recommend
      maximumMemoryUsage, // in MB
      maximumScreenSpaceError: sse, // Customized
      // throttleRequests: false,
      maximumTilesSelected,
      // maxRequests: 30,

      /**
       * We need this method because we have to calculate memory usage ourselves
       */
      async contentLoader(tile: Tile3D) {
        let tileItem: TileItem = _this.tileMap.get(tile.id);

        if (!tileItem) {
          switch (tile.type) {
            case TILE_TYPE.SCENEGRAPH:
            case TILE_TYPE.MESH: {
              tileItem = await _this.createTileItem(tile);
              break;
            }
            default:
              break;
          }

          if (tileItem) {
            _this.tileMap.set(tile.id, tileItem);
          }
        }
      },

      // onTileLoad(tile: Tile3D) {  },

      onTileUnload(tile: Tile3D) {
        _this.tileUnloadQueue.push(tile);
      },

      onTileError(tile: Tile3D, message: string) {
        console.error('onTileError', tile, message);
      },
    });

    this.tileset.maximumMemoryUsage = this.tileset.options.maximumMemoryUsage;

    model.getScreenSpaceError().setValue(sse);
  }

  public async reload() {
    if (this.tilesetURL != null) {
      this.load(this.tilesetURL);
    }
  }

  public setViewDimension(w: number, h: number) {
    this.viewWidth = w;
    this.viewHeight = h;
    this.update();
  }

  public updateShowBoundingBoxes() {
    if (!this.tileset || this.loadInProgress) return;

    const showBoundingBoxes = MainModel.getInstance().getShowBoundingBoxes().getValue();
    this.tileMap.values().forEach((tileItem) => {
      tileItem.asset.meshes.forEach((mesh) => {
        if (mesh.name === '__root__') return;
        mesh.showBoundingBox = showBoundingBoxes;
      });
    });
  }

  public updateScreenSpaceError() {
    if (!this.tileset) return;

    const sse = MainModel.getInstance().getScreenSpaceError().getValue();
    this.tileset.options.maximumScreenSpaceError = sse;
    this.tileset.memoryAdjustedScreenSpaceError =  4 * sse;
    this.tileset.adjustScreenSpaceError();
    this.update();
  }

  public async update() {
    if (!this.tileset || this.loadInProgress) return;

    const camPos = this.camera.position.clone();
    const camOffs = new Vector3(0, 0, 0)
    camPos.addInPlace(camOffs);

    const glPosition = this.toMathGLVector3(camPos);

    const [longitude, latitude, altitude] = this.tileset.root.boundingBox[0];
    // const [longitude, latitude, altitude] = this.tileset.ellipsoid.cartesianToCartographic(
    //   glPosition.transform(this.tileset.root.transform)
    // );


    const alphaDeg = Tools.ToDegrees(this.camera.alpha);
    const betaDeg = Tools.ToDegrees(this.camera.beta);
    const pitch = (betaDeg - 90) % 360;
    const bearing = (-alphaDeg - 90) % 360;
    const savedMinZ = this.camera.minZ;
    // TODO! Find out why loaders need a near plane of minimum 1
    this.camera.minZ = 1;
    const projectionMatrix = this.camera.getProjectionMatrix().transpose().asArray();
    this.camera.minZ = savedMinZ;

    const options: FirstPersonViewportOptions = {
      longitude,
      latitude,
      position: [glPosition[0], glPosition[1], glPosition[2] + altitude],
      pitch,
      bearing,
      width: this.viewWidth,
      height: this.viewHeight,
      projectionMatrix,
    };

    try {
      let closestDistanceToCamera = Number.MAX_VALUE;
      const viewport = new FirstPersonViewport(options);
      const frameState = await this.tileset.selectTiles(viewport);

      if (frameState === this.lastFrameState) return;

      this.lastFrameState = frameState;

      this.tileset?.tiles.forEach((tile: Tile3D) => {
        const tileItem = this.tileMap.get(tile.id);
        if (!tileItem) return;

        if (tile.selected) {
          closestDistanceToCamera = Math.min(closestDistanceToCamera, tile.distanceToCamera);
          tileItem.assetRoot.setEnabled(true);
          tileItem.asset.addAllToScene();
          return;
        }

        tileItem.assetRoot.setEnabled(false);
        tileItem.asset.removeAllFromScene();
      });

      // Unload the tiles
      while (this.tileUnloadQueue.length > 0) {
        const tile = this.tileUnloadQueue.pop();
        const tileItem = this.tileMap.get(tile.id);
        if (tileItem && tile.contentState === TILE_CONTENT_STATE.UNLOADED) {
          tileItem.asset.dispose();
          tileItem.assetRoot.dispose();
          this.tileMap.delete(tile.id);
        }
      }

      if (!this.tileset) return;

      const cameraPositionString = this.camera.position.x.toFixed(2) + ', ' + this.camera.position.y.toFixed(2) + ', ' + this.camera.position.z.toFixed(2);
      const cameraTargetString = this.camera.target.x.toFixed(2) + ', ' + this.camera.target.y.toFixed(2) + ', ' + this.camera.target.z.toFixed(2);
      const stats = {
        cameraPosition: cameraPositionString,
        cameraTarget: cameraTargetString,
        dist: closestDistanceToCamera.toFixed(2),
        viewDistanceScale: this.tileset.options.viewDistanceScale,
        tileMap: this.tileMap.size.toFixed(),
        unloadQueue: this.tileUnloadQueue.length.toFixed(),
        tilesetStats: Object.entries(this.tileset.stats.getTable()).reduce(
          (acc, [key, value]) => ({ ...acc, [key]: value.count }),
          {}
        ),
        fps: this.scene.getEngine().getFps().toFixed()
      };
      const statsText = JSON.stringify(stats, null, 2);
      MainModel.getInstance().getTilesetStats().setValue(statsText);
    } catch (err) {
      console.log('--> ERROR try to select tiles: ', err);
    }
  }

  private async createTileItem(tile: Tile3D): Promise<TileItem> {
    const tileItem: TileItem = {
      asset: null,
      assetRoot: null,
    };

    if (!tile.content.byteLength) {
      // In some cases (Google 3D Tiles) the byte length is not set in the content header
      tile.content.byteLength = tile.content.gltfArrayBuffer.byteLength;
    }

    const showBoundingBoxes = MainModel.getInstance().getShowBoundingBoxes().getValue();
    const buffer = tile.content.gltfArrayBuffer as ArrayBuffer;
    const file = new File([buffer], tile.id);

    tileItem.asset = await SceneLoader.LoadAssetContainerAsync('file:', file, this.scene, null, '.glb', tile.id);

    // While waiting for loading completed the tile itself may have been changed (unloaded)
    if (!tile.content) return null;

    tileItem.assetRoot = tileItem.asset.createRootMesh();
    tileItem.assetRoot.id = 'asset_' + tile.id;
    // tileItem.asset.addAllToScene();
    tileItem.assetRoot.setEnabled(false);

    // Estimate the vram memory used by this tile
    let totalMeshSize = 0;
    tileItem.asset.meshes.forEach((mesh) => {
      if (mesh.name !== '__root__') {
        mesh.showBoundingBox = showBoundingBoxes;
      }
      const indices = mesh.getIndices();
      const positions = mesh.getPositionData();
      if (indices && positions) {
        totalMeshSize += indices.length * 2;
        totalMeshSize += positions.length * 2;
      }
    });
    tile.content.geometriesByteLength = totalMeshSize;

    let totalTextureSize = 0;
    tileItem.asset.textures.forEach((texture) => {
      totalTextureSize += texture.getSize().width * texture.getSize().height * 4;
    });

    tile.content.texturesByteLength = totalTextureSize;
    tile.content.gpuMemoryUsageInBytes = totalMeshSize + totalTextureSize;

    return tileItem;
  }

  private toBabylonVector3(v: MathGLVector3): Vector3 {
    if (this.scene.useRightHandedSystem) {
      return new Vector3(v.x, v.z, v.y);
    }
    return new Vector3(-v.x, v.z, -v.y);
  }

  private toMathGLVector3(v: Vector3): MathGLVector3 {
    if (this.scene.useRightHandedSystem) {
      return new MathGLVector3(v.x, v.z, v.y);
    }
    return new MathGLVector3(-v.x, -v.z, v.y);
  }
}
