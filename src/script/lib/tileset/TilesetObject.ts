import {
  ArcRotateCamera,
  Scene,
  Vector3,
  Matrix,
  Tools,
  AssetContainer,
  SceneLoader,
  Mesh,
  Quaternion,
} from '@babylonjs/core';
import FirstPersonViewport from '@deck.gl/core/dist/viewports/first-person-viewport';

import { load, LoaderOptions } from '@loaders.gl/core';
import { Tiles3DLoader, Tiles3DLoaderOptions, Tiles3DTilesetJSONPostprocessed } from '@loaders.gl/3d-tiles';
import { Tileset3D, Tile3D, TILE_CONTENT_STATE, TILE_TYPE } from '@loaders.gl/tiles';
import { Vector3 as MathGLVector3, Matrix4, toDegrees } from '@math.gl/core';
import { PI_OVER_TWO, TWO_PI } from '@math.gl/core/dist/lib/math-utils';
import { Ellipsoid } from '@math.gl/geospatial';

import MainModel from '../../app/model/MainModel';

interface TileItem {
  asset: AssetContainer;
  assetRoot: Mesh;
  addedToScene: boolean;
}

export default class TilesetObject {
  private scene: Scene;
  private camera: ArcRotateCamera;
  private viewWidth: number;
  private viewHeight: number;
  private tilesetURL: string;
  private tilesetJson: Tiles3DTilesetJSONPostprocessed;
  private tileset: Tileset3D;
  private glGlobalTransform: Matrix4;
  private glInverseGlobalTransform: Matrix4;

  private tileMap: Map<string, TileItem> = new Map();
  private tileUnloadQueue = [];

  private lastFrameState = -1;

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
    for (const tileItem of this.tileMap.values()) {
      tileItem.asset.dispose();
      tileItem.assetRoot.dispose();
    }
    this.tileMap?.clear();
    this.tileUnloadQueue = [];
    this.tileset?.destroy();
    this.tileset = null;
  }

  public async load(url: string) {
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
      //   loadImages: false,
      // },
      '3d-tiles': {
        loadGLTF: false,
      },
      fetch: {
        credentials,
      },
    };
    console.log('--> loadOptions: ', loadOptions);

    this.tilesetJson = await load(url, Tiles3DLoader, loadOptions);

    console.log(this.tilesetJson);

    const model = MainModel.getInstance();
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

      onTileLoad(tile: Tile3D) {
        let tileItem: TileItem = _this.tileMap.get(tile.id);

        if (!tileItem) return;

        // // Convert tile's center from ECEF to ENU (relative to tileset center)
        // const glTileCenterECEF = tile.boundingVolume.center;
        // const glTileCenterENU = new MathGLVector3(_this.glInverseGlobalTransform.transform(glTileCenterECEF));
        // const tileCenter = _this.toBabylonVector3(glTileCenterENU);

        // // Convert tile's model matrix to Babylon.js format
        // const tileMatrix = Matrix.FromArray(tile.content.modelMatrix);
        // const zUpToYUp = Matrix.RotationX(-Math.PI / 2);
        // const glTileMatrix = tileMatrix.multiply(zUpToYUp);

        // // Decompose final glTileMatrix into position, rotation, and scale
        // const scale = Vector3.One();
        // const rotation = Quaternion.Identity();
        // const translation = Vector3.Zero();

        // glTileMatrix.decompose(scale, rotation, translation);

        // // Adjust translation using tile's global offset in ENU
        // translation.addInPlace(tileCenter);

        // const glFinalTileMatrix = glTileMatrix
        //   .getRotationMatrix()
        //   .clone()
        //   .multiply(Matrix.Translation(translation.x, translation.y, translation.z));

        // glFinalTileMatrix.decompose(scale, rotation, translation);


        const cartesianModelMatrix = _this.calculateCartesianModelMatrix(tile);  // transformation matrix for tile meshes in ECEF
        if (!cartesianModelMatrix) return;

        const {ecefToEnu, ecefToEnuYUp} = _this.calculateTilesetTransforms();
        const tileToLocalBabylonMatrix = ecefToEnuYUp.multiplyRight(cartesianModelMatrix);

        const babylonMatrix = Matrix.FromArray(tileToLocalBabylonMatrix);
        var scale = new Vector3();
        var rotation = new Quaternion();
        var translation = new Vector3();
        babylonMatrix.decompose(scale, rotation, translation);

        // Apply final transformations to the Babylon.js mesh
        tileItem.assetRoot.position = translation; // Corrected position
        tileItem.assetRoot.rotationQuaternion = rotation; // Corrected rotation

        _this.update();
      },

      onTileUnload(tile: Tile3D) {
        _this.tileUnloadQueue.push(tile);
      },

      onTileError(tile: Tile3D, message: string) {
        console.error('onTileError', tile, message);
      },
    });

    this.tileset.maximumMemoryUsage = this.tileset.options.maximumMemoryUsage;

    this.glGlobalTransform = Ellipsoid.WGS84.eastNorthUpToFixedFrame(this.tileset.cartesianCenter);
    this.glInverseGlobalTransform = this.glGlobalTransform.clone().invert();

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
    if (!this.tileset) return;

    const showBoundingBoxes = MainModel.getInstance().getShowBoundingBoxes().getValue();
    for (const tileItem of this.tileMap.values()) {
      tileItem.asset.meshes.forEach((mesh) => {
        if (mesh.name === '__root__') return;
        mesh.showBoundingBox = showBoundingBoxes;
      });
    }
  }

  public updateScreenSpaceError() {
    if (!this.tileset) return;

    const sse = MainModel.getInstance().getScreenSpaceError().getValue();
    this.tileset.options.maximumScreenSpaceError = sse;
    this.tileset.memoryAdjustedScreenSpaceError = 4 * sse;
    this.tileset.adjustScreenSpaceError();
    this.update();
  }

  public async update() {
    if (!this.tileset) return;

    try {
      // const camPos = this.camera.position.clone();
      // const camTarget = this.camera.target.clone();

      // const glCamPos = this.toMathGLVector3(camPos);
      // const glCamTarget = this.toMathGLVector3(camTarget);
      // const glCamForward = new MathGLVector3( // actually is forward vector in ENU, not ECEF. Why does it work?
      //   glCamTarget.x - glCamPos.x,
      //   glCamTarget.y - glCamPos.y,
      //   glCamTarget.z - glCamPos.z
      // ).normalize();

      // const glCamPosECEF = this.glGlobalTransform.transform([
      //   // transform camera from ENU into ECEF
      //   glCamPos.x,
      //   glCamPos.y,
      //   glCamPos.z,
      // ]);

      // const [longitude, latitude, altitude] = Ellipsoid.WGS84.cartesianToCartographic(glCamPosECEF);
      // const bearing = toDegrees(TWO_PI - cesiumZeroToTwoPi(Math.atan2(glCamForward.y, glCamForward.x) - PI_OVER_TWO));
      // const pitch = -Tools.ToDegrees(PI_OVER_TWO - cesiumAcosClamped(glCamForward.z));

      const babylonCamera = this.scene.activeCamera as ArcRotateCamera;
 
      const { ecefToEnu, ecefToEnuYUp } = this.calculateTilesetTransforms();
      const enuYUptoECEF = ecefToEnuYUp.clone().invert(); // from ENU Y Up (scene-based handedness) to ECEF Z Up (origin is referenceECEF)
 
      // calculate long/lat/alt from local ENU camera position. First transform to ECEF, then to cartographic
      const camPosLocal = new MathGLVector3(babylonCamera.position.x, babylonCamera.position.y, babylonCamera.position.z);
      const camTargetLocal = new MathGLVector3(babylonCamera.target.x, babylonCamera.target.y, babylonCamera.target.z);
      const cameraPositionECEF = new MathGLVector3(enuYUptoECEF.transform(camPosLocal));
      const cameraTargetECEF = new MathGLVector3(enuYUptoECEF.transform(camTargetLocal));
      const [longitude, latitude, altitude] = Ellipsoid.WGS84.cartesianToCartographic(cameraPositionECEF);

      // calculate forward vector in ENU to get bearing and pitch
      const forwardECEF = cameraTargetECEF.subtract(cameraPositionECEF).normalize(); // camera forward vector in ECEF
      const forwardENU = new MathGLVector3(ecefToEnu.transformAsVector(forwardECEF)).normalize(); // camera forward vector in ENU, right handed X=>east, Y=>north, Z=>up,
      const bearing = toDegrees(TWO_PI - cesiumZeroToTwoPi(Math.atan2(forwardENU.y, forwardENU.x) - PI_OVER_TWO));
      const pitch = -toDegrees(PI_OVER_TWO - cesiumAcosClamped(forwardENU.z));

      const viewport = new FirstPersonViewport({
        longitude,
        latitude,
        position: [0, 0, altitude],
        pitch: pitch,
        bearing: bearing,
        width: this.viewWidth,
        height: this.viewHeight,
      });

      let closestDistanceToCamera = Number.MAX_VALUE;
      const frameState = await this.tileset.selectTiles(viewport);

      if (frameState === this.lastFrameState) return;

      this.lastFrameState = frameState;

      for (const tileItem of this.tileMap.values()) tileItem.addedToScene = undefined;

      // Show/Hide tiles
      this.tileset?.tiles.forEach((tile: Tile3D) => {
        const tileItem = this.tileMap.get(tile.id);
        if (!tileItem) return;

        if (tile.selected) {
          closestDistanceToCamera = Math.min(closestDistanceToCamera, tile.distanceToCamera);
          tileItem.assetRoot.setEnabled(true);
          tileItem.asset.addAllToScene();
          tileItem.addedToScene = true;
          return;
        }

        tileItem.assetRoot.setEnabled(false);
        tileItem.asset.removeAllFromScene();
        tileItem.addedToScene = false;
      });

      // Unload tiles
      while (this.tileUnloadQueue.length > 0) {
        const tile = this.tileUnloadQueue.pop();
        const tileItem = this.tileMap.get(tile.id);
        if (tileItem && tile.contentState === TILE_CONTENT_STATE.UNLOADED) {
          tileItem.asset.dispose();
          tileItem.assetRoot.dispose();
          this.tileMap.delete(tile.id);
        }
      }

      for (const tileItem of this.tileMap.values()) {
        if (tileItem.addedToScene === undefined) {
          tileItem.asset.removeFromScene();
        }
      }

      const cameraPositionString = cameraPositionECEF[0].toFixed(2) + ', ' + cameraPositionECEF[1].toFixed(2) + ', ' + cameraPositionECEF[2].toFixed(2);
      const cameraTargetString = cameraPositionECEF[0].toFixed(2) + ', ' + cameraPositionECEF[1].toFixed(2) + ', ' + cameraPositionECEF[2].toFixed(2);
      const stats = {
        camPos: cameraPositionString,
        camTarget: cameraTargetString,
        dist: closestDistanceToCamera.toFixed(2),
        viewDistanceScale: this.tileset?.options.viewDistanceScale,
        tileMap: this.tileMap.size.toFixed(),
        unloadQueue: this.tileUnloadQueue.length.toFixed(),
        tilesetStats: Object.entries(this.tileset?.stats.getTable()).reduce(
          (acc, [key, value]) => ({ ...acc, [key]: value.count }),
          {}
        ),
        fps: this.scene.getEngine().getFps().toFixed(),
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
      addedToScene: false,
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
      return new Vector3(v.x, v.z, -v.y);
    }
    return new Vector3(v.x, v.z, v.y);
  }

  private toMathGLVector3(v: Vector3): MathGLVector3 {
    if (this.scene.useRightHandedSystem) {
      return new MathGLVector3(v.x, -v.z, v.y);
    }
    return new MathGLVector3(v.x, v.z, v.y);
  }

  private calculateTilesetTransforms() {
    const referenceECEF = this.tileset.cartesianCenter; // reference ECEF
    return this._calculateTilesetTransforms(referenceECEF);
  }

  private calculateCartesianModelMatrix(tile: Tile3D): Matrix4 {
    if (!tile) return null;
    return this._calculateCartesianModelMatrix(tile.computedTransform, tile.content?.rtcCenter, tile.content?.gltfUpAxis);
  }

  private _calculateTilesetTransforms(referenceECEF: MathGLVector3) {
    const globalTransform = Ellipsoid.WGS84.eastNorthUpToFixedFrame(referenceECEF);
    const ecefToEnu = globalTransform.clone().invert(); // ECEF to ENU Z Up (right handed)
    const ecefToEnuYUp = this._convertToYup(ecefToEnu); // ECEF to ENU Y Up (and handle handedness)
    return { ecefToEnu, ecefToEnuYUp }
  }
 
  private _convertToYup(matrix: Matrix4): Matrix4 {
    const zUpToYUp = new Matrix4().rotateX(-Math.PI / 2); // turn from Z up to Y up (right handed)
 
    if (this.scene.useRightHandedSystem) {
      return matrix.clone().multiplyLeft(zUpToYUp);
    } else {
      const flipZ = new Matrix4().scale([1, 1, -1]); // needs to happen when left handed
      return matrix.clone().multiplyLeft(zUpToYUp).multiplyLeft(flipZ);
    }
  }
 
  private _calculateCartesianModelMatrix(transform: Matrix4, rtcCenter: MathGLVector3, gltfUpAxis: string): Matrix4 {
    let cartesianModelMatrix = transform.clone();
    if (rtcCenter) {
      cartesianModelMatrix.translate(rtcCenter);
    }
    switch (gltfUpAxis) {
      case 'Y':
        cartesianModelMatrix = cartesianModelMatrix.multiplyRight(new Matrix4().rotateX(Math.PI / 2)); // for right handed
        // if (!this.scene.useRightHandedSystem) {
        //   cartesianModelMatrix = cartesianModelMatrix.multiplyRight(new Matrix4().rotateX(-Math.PI / 2)); // for left handed
        // }
        break;
      case 'X':
        cartesianModelMatrix = cartesianModelMatrix.multiplyRight(new Matrix4().rotateY(-Math.PI / 2));
        break;
      case 'Z':
      default:
        // no change
        break;
    }
    if (!this.scene.useRightHandedSystem) {
      const rotate180 = new Matrix4().rotateX(Math.PI);
      cartesianModelMatrix = cartesianModelMatrix.multiplyRight(rotate180);
    }
    return cartesianModelMatrix;
  }

}

// HINT! Copy of the cesium zeroToTwoPi function to avoid importing the cesium lib
const EPSILON14 = 0.00000000000001;

const cesiumMod = (m, n) => {
  if (Math.sign(m) === Math.sign(n) && Math.abs(m) < Math.abs(n)) {
    // Early exit if the input does not need to be modded. This avoids
    // unnecessary math which could introduce floating point error.
    return m;
  }
  return ((m % n) + n) % n;
};

const cesiumZeroToTwoPi = (angle) => {
  if (angle >= 0 && angle <= TWO_PI) {
    // Early exit if the input is already inside the range. This avoids
    // unnecessary math which could introduce floating point error.
    return angle;
  }
  const mod = cesiumMod(angle, TWO_PI);
  if (Math.abs(mod) < EPSILON14 && Math.abs(angle) > EPSILON14) {
    return TWO_PI;
  }
  return mod;
};

const cesiumClamp = (value, min, max) => {
  return value < min ? min : value > max ? max : value;
};

const cesiumAcosClamped = (value) => {
  return Math.acos(cesiumClamp(value, -1.0, 1.0));
};
// HINT end
