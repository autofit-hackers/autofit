import { NormalizedLandmark } from '@mediapipe/pose';
// eslint-disable-next-line import/no-unresolved
import BaseReactPlayer, { BaseReactPlayerProps } from 'react-player/base';
import {
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  GridHelper,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { copyLandmark, KINECT_POSE_CONNECTIONS } from '../training_data/pose';

import { Set } from '../training_data/set';

export type CameraPosition = {
  theta: number;
  phi: number;
  distance: number;
};

/**
 * Configuration for the landmark grid and its default value.
 */
export type PoseGridConfig = {
  backgroundColor: number;
  cameraFov: number;
  axesColor: number;
  axesWidth: number;
  shouldSetLabels: boolean;
  connectionColor: number;
  connectionWidth: number;
  definedColors: Array<{ name: string; value: number }>;
  /**
   * The "fitToGrid" attribute describes whether the grid should dynamically
   * resize based on the landmarks given.
   */
  fitToGrid: boolean;
  labelPrefix: string;
  labelSuffix: string;
  landmarkColor: number;
  landmarkSize: number;
  margin: number;
  minVisibility: number;
  nonvisibleLandmarkColor: number;
  numCellsPerAxis: number;
  /**
   * The "range" attribute describes the default numerical boundaries of the
   * grid. The grid ranges from [-range, range] on every axis.
   */
  range: number;
  showHidden: boolean;
};

const DEFAULT_POSE_GRID_CONFIG: PoseGridConfig = {
  backgroundColor: 0,
  cameraFov: 75,
  axesColor: 0xffffff,
  axesWidth: 2,
  shouldSetLabels: false,
  connectionColor: 0x00ffff,
  connectionWidth: 4,
  definedColors: [],
  fitToGrid: true,
  labelPrefix: '',
  labelSuffix: '',
  landmarkSize: 2,
  landmarkColor: 0xaaaaaa,
  margin: 0,
  minVisibility: 0,
  nonvisibleLandmarkColor: 0xff7777,
  numCellsPerAxis: 3,
  range: 1,
  showHidden: true,
};

/**
 * A connection between two landmarks
 */
type Connection = number[];

/**
 * A list of connections between landmarks
 */
type ConnectionList = Connection[];

/**
 * Name for a color
 */
type ColorName = Exclude<string, ''>;

/**
 * An interface for specifying colors for lists (e.g. landmarks and connections)
 */
type ColorMap<T> = Array<{ color: ColorName | undefined; list: T[] }>;

/**
 * Provides a 3D grid that is rendered onto a canvas where landmarks and
 * connections can be drawn.
 */
export class PoseGrid {
  rotation: number;
  disposeQueue: Array<BufferGeometry>;
  removeQueue: Array<Object3D>;
  container: HTMLDivElement;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  scene: Scene;
  orbitControls: OrbitControls;
  size: number;
  landmarks: Array<NormalizedLandmark>;
  landmarkGroup: Group;
  connectionGroup: Group;
  origin: Vector3;
  poseGridConfig: PoseGridConfig;
  axesMaterial: Material;
  definedColors: { [colorName: string]: Material };
  connectionMaterial: Material;
  landmarkGeometry: BufferGeometry;
  landmarkMaterial: Material;
  gridMaterial: Material;
  nonvisibleMaterial: Material;
  sizeWhenFitted: number;
  isVisible: (normalizedLandmark: NormalizedLandmark) => boolean;

  /**
   * @public
   */
  constructor(parent: HTMLElement, poseGridConfig = DEFAULT_POSE_GRID_CONFIG) {
    this.poseGridConfig = poseGridConfig;
    this.rotation = 0;
    this.disposeQueue = [];
    this.removeQueue = [];
    this.container = document.createElement('div');
    this.container.classList.add('viewer-widget-js');
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    this.container.appendChild(canvas);
    parent.appendChild(this.container);
    const parentBox: DOMRect = parent.getBoundingClientRect();
    this.camera = new PerspectiveCamera(this.poseGridConfig.cameraFov, parentBox.width / parentBox.height, 1);
    this.camera.lookAt(new Vector3());
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(new Color(this.poseGridConfig.backgroundColor), 0.5);
    this.renderer.setSize(Math.floor(parentBox.width), Math.floor(parentBox.height));
    window.addEventListener(
      'resize',
      /**
       * @return {void}
       */ (): void => {
        const box: DOMRect = parent.getBoundingClientRect();
        this.renderer.setSize(Math.floor(box.width), Math.floor(box.height));
      },
    );
    this.scene = new Scene();
    // カメラコントローラーを作成
    this.orbitControls = new OrbitControls(this.camera, canvas);
    // 滑らかにカメラコントローラーを制御する
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.2;

    this.size = 100;
    this.landmarks = [];
    this.landmarkMaterial = new MeshBasicMaterial({ color: this.poseGridConfig.landmarkColor });
    this.landmarkGeometry = new SphereGeometry(this.poseGridConfig.landmarkSize);
    this.nonvisibleMaterial = new MeshBasicMaterial({ color: this.poseGridConfig.nonvisibleLandmarkColor });
    this.axesMaterial = new LineBasicMaterial({
      color: this.poseGridConfig.axesColor,
      linewidth: this.poseGridConfig.axesWidth,
    });
    this.gridMaterial = new LineBasicMaterial({ color: 0x999999 });
    this.connectionMaterial = new LineBasicMaterial({
      color: this.poseGridConfig.connectionColor,
      linewidth: this.poseGridConfig.connectionWidth,
    });
    this.isVisible = (normalizedLandmark: NormalizedLandmark): boolean =>
      normalizedLandmark.visibility === undefined ||
      (!!normalizedLandmark.visibility && normalizedLandmark.visibility > this.poseGridConfig.minVisibility);
    this.definedColors = {};
    this.poseGridConfig.definedColors.forEach((color) => {
      this.definedColors[color.name] = new LineBasicMaterial({
        color: color.value,
        linewidth: this.poseGridConfig.connectionWidth,
      });
    });
    this.poseGridConfig.definedColors.forEach((color) => {
      this.definedColors[color.name] = new LineBasicMaterial({
        color: color.value,
        linewidth: this.poseGridConfig.connectionWidth,
      });
    });
    this.sizeWhenFitted = 1 - 2 * this.poseGridConfig.margin;

    const gridPlane = new GridHelper(100, 10);
    // TODO: this is a magic-number hack to get the pose's foot to be on the grid. should be fixed to automatically adjust grid y to foot position.
    gridPlane.translateY(-this.size / 4);
    this.scene.add(gridPlane);
    this.landmarkGroup = new Group();
    this.scene.add(this.landmarkGroup);
    this.connectionGroup = new Group();
    this.scene.add(this.connectionGroup);
    this.origin = new Vector3();
    this.requestFrame();
  }

  updateOrbitControls(): void {
    window.requestAnimationFrame((): void => {
      this.orbitControls.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  /**
   * @private:
   */
  requestFrame(): void {
    window.requestAnimationFrame((): void => {
      this.renderer.render(this.scene, this.camera);
    });
  }

  /**
   * @private:(in setLabels)
   */
  getCanvasPosition(position: Vector3): Vector3 {
    const size: DOMRect = this.renderer.domElement.getBoundingClientRect();
    const canvasPosition: Vector3 = position.clone().project(this.camera);
    // Converts from normalized device coordinates ([-1, 1]) to canvas space ([0, canvas.width])
    canvasPosition.x = Math.round((0.5 + canvasPosition.x * 0.5) * size.width);
    // Converts from normalized device coordinates ([-1, 1]) to canvas space ([0, canvas.height])
    canvasPosition.y = Math.round((0.5 - canvasPosition.y * 0.5) * size.height);
    canvasPosition.z = 0;

    return canvasPosition;
  }

  /**
   * @public: カメラ位置を三次元極座標（角度は度数法）で指定する
   */
  // Default parameters are set so that the grid is viewed from the side
  setCameraPosition(cameraPosition: CameraPosition = { theta: 90, phi: 0, distance: 150 }): void {
    const { theta, phi, distance } = cameraPosition;
    const thetaRad = (theta * Math.PI) / 180;
    const phiRad = (phi * Math.PI) / 180;
    this.camera.position.x = Math.sin(thetaRad) * Math.cos(phiRad) * distance;
    this.camera.position.z = Math.sin(thetaRad) * Math.sin(phiRad) * distance;
    this.camera.position.y = Math.cos(thetaRad) * distance;
    this.camera.lookAt(new Vector3());
  }

  /**
   * @public: Update the landmarks coordinates in OnResults callback.
   */
  updateLandmarks(
    landmarks: NormalizedLandmark[],
    colorConnections?: ConnectionList | ColorMap<Connection>,
    colorLandmarks?: ColorMap<number>,
  ): void {
    this.connectionGroup.clear();
    this.clearResources();
    this.landmarks = landmarks.map(copyLandmark);
    // Convert connections to ColorList if not already
    let connections: ColorMap<Connection> = [];
    if (colorConnections) {
      if (colorConnections.length > 0 && !Object.prototype.hasOwnProperty.call(colorConnections[0], 'color')) {
        connections = [{ color: undefined, list: colorConnections as ConnectionList }];
      } else {
        connections = colorConnections as ColorMap<Connection>;
      }
    }
    const visibleLandmarks: Array<NormalizedLandmark> = this.landmarks.filter(
      (normalizedLandmark: NormalizedLandmark): boolean => this.isVisible(normalizedLandmark),
    );
    const centeredLandmarks: Array<NormalizedLandmark> =
      visibleLandmarks.length === 0 ? this.landmarks : visibleLandmarks;
    // Fit to grid if necessary
    let scalingFactor = 1;
    if (this.poseGridConfig.fitToGrid) {
      const rawScalingFactor: number = this.getFitToGridFactor(centeredLandmarks);
      const RESCALE = 0.5;
      const { range } = this.poseGridConfig;
      // Finds the deviation from the default range ((1 / rawScalingFactor - 1)
      // * (range / 2)), and then it divides it by the step size of RESCALE. We
      // go the next step with Math.ceil. This calculation allows for discrete
      // steps.
      const numRescaleSteps: number = Math.ceil(((1 / rawScalingFactor - 1) * (range / 2)) / RESCALE);
      // Scaling factor takes the number of these steps and converts it back
      // into a factor that the landmark can be multiplied by.
      scalingFactor = 1 / ((numRescaleSteps * RESCALE) / (range / 2) + 1);
      this.landmarks.forEach((landmark: NormalizedLandmark) => {
        // eslint-disable-next-line no-param-reassign
        landmark.x *= scalingFactor;
        // eslint-disable-next-line no-param-reassign
        landmark.y *= scalingFactor;
        // eslint-disable-next-line no-param-reassign
        landmark.z *= scalingFactor;
      });
    }
    const landmarkVectors: Array<Vector3> = this.landmarks.map(
      (normalizedLandmark: NormalizedLandmark): Vector3 => this.landmarkToVector(normalizedLandmark),
    );
    // Connections
    connections.forEach((connection) => {
      this.drawConnections(landmarkVectors, connection.list, connection.color);
    });
    // Shrink/Grow landmarks to fit
    const meshLength: number = this.landmarkGroup.children.length;
    const landmarkLength: number = this.landmarks.length;
    if (meshLength < landmarkLength) {
      for (let i = meshLength; i < landmarkLength; i += 1) {
        this.landmarkGroup.add(new Mesh(this.landmarkGeometry));
      }
    } else if (meshLength > landmarkLength) {
      for (let i = landmarkLength; i < meshLength; i += 1) {
        this.landmarkGroup.remove(this.landmarkGroup.children[i]);
      }
    }
    this.drawLandmarks(landmarkVectors);
    // Color special landmarks
    if (colorLandmarks) {
      colorLandmarks.forEach((colorDef) => {
        this.colorLandmarks(colorDef.list, colorDef.color);
      });
    }
    this.requestFrame();
  }

  /**
   * @private (in Update)
   */
  clearResources(): void {
    this.removeQueue.forEach((object3D): void => {
      if (object3D.parent) object3D.parent.remove(object3D);
    });
    this.removeQueue = [];
    this.disposeQueue.forEach((bufferGeometry): void => {
      bufferGeometry.dispose();
    });
    this.disposeQueue = [];
  }

  drawLandmarks(landmarkVectors: Vector3[]): void {
    for (let i = 0; i < this.landmarks.length; i += 1) {
      const visible: boolean = this.isVisible(this.landmarks[i]);
      let { nonvisibleMaterial } = this;
      if (!this.poseGridConfig.showHidden && !visible) {
        nonvisibleMaterial = new Material();
        nonvisibleMaterial.visible = false;
      }
      const sphere: Mesh = this.landmarkGroup.children[i] as Mesh;
      sphere.material = visible ? this.landmarkMaterial : nonvisibleMaterial;
      sphere.position.copy(landmarkVectors[i]);
    }
  }

  /**
   * @private: Colors the landmarks based on their type. (in Update)
   */
  colorLandmarks(
    landmarks: (undefined | Array<number>) | undefined,
    colorName: (undefined | string) | undefined,
  ): void {
    const color: Material = colorName ? this.definedColors.colorName : this.connectionMaterial;
    const meshList: Array<Mesh> = this.landmarkGroup.children as Array<Mesh>;
    if (landmarks) {
      landmarks.forEach((landmarkIndex: number) => {
        if (this.isVisible(this.landmarks[landmarkIndex])) meshList[landmarkIndex].material = color;
      });
    } else {
      for (let i = 0; i < this.landmarks.length; i += 1) {
        if (this.isVisible(this.landmarks[i])) meshList[i].material = color;
      }
    }
  }

  /**
   * @private: Draws connections between landmarks.(in Update)
   */
  drawConnections(
    landmarks: Array<Vector3>,
    connections: Array<Array<number>>,
    colorName: (undefined | string) | undefined,
  ): void {
    const color: Material = colorName ? this.definedColors[colorName] : this.connectionMaterial;
    const lines: Array<Vector3> = [];
    connections.forEach((connection: number[]): void => {
      if (
        this.poseGridConfig.showHidden ||
        (this.isVisible(this.landmarks[connection[0]]) && this.isVisible(this.landmarks[connection[1]]))
      ) {
        lines.push(landmarks[connection[0]]);
        lines.push(landmarks[connection[1]]);
      }
    });
    const geometry: BufferGeometry = new BufferGeometry().setFromPoints(lines);
    this.disposeQueue.push(geometry);
    const wireFrame: LineSegments = new LineSegments(geometry, color);
    this.removeQueue.push(wireFrame);
    this.connectionGroup.add(wireFrame);
  }

  /**
   * @private: Converts a landmark to a vector.(in Update)
   */
  landmarkToVector(point: NormalizedLandmark): Vector3 {
    return new Vector3(point.x, -point.y, -point.z).multiplyScalar(this.size / this.poseGridConfig.range);
  }

  /**
   * @private: Returns the scaling factor for the landmarks to fit to the grid.(in Update)
   */
  getFitToGridFactor(landmarks: (undefined | Array<NormalizedLandmark>) | undefined): number {
    if (!landmarks) {
      // eslint-disable-next-line no-param-reassign
      landmarks = this.landmarks;
    }
    if (landmarks.length === 0) {
      return 1;
    }
    let factor = Infinity;
    for (let i = 0; i < landmarks.length; i += 1) {
      const maxNum: number = Math.max(Math.abs(landmarks[i].x), Math.abs(landmarks[i].y), Math.abs(landmarks[i].z));
      factor = Math.min(factor, this.poseGridConfig.range / 2 / maxNum);
    }

    return factor * this.sizeWhenFitted;
  }

  startSynchronizingToVideo(
    videoRef: React.RefObject<BaseReactPlayer<BaseReactPlayerProps>>,
    setRecord: Set,
    displayedRepIndex: number,
  ) {
    if (videoRef.current != null) {
      const currentVideoDuration = videoRef.current.getDuration();
      const currentVideoTime = videoRef.current.getCurrentTime();
      const currentVideoProgress = currentVideoTime / currentVideoDuration;
      const currentPoseFrame = Math.round(currentVideoProgress * setRecord.reps[displayedRepIndex].form.length);
      const currentPoseFrameLandmarks = setRecord.reps[displayedRepIndex].form[currentPoseFrame]?.worldLandmarks;
      if (currentPoseFrameLandmarks) {
        this.updateLandmarks(
          setRecord.reps[displayedRepIndex].form[currentPoseFrame].worldLandmarks,
          KINECT_POSE_CONNECTIONS,
        );
      } else {
        this.updateOrbitControls();
      }
      requestAnimationFrame(() => this.startSynchronizingToVideo(videoRef, setRecord, displayedRepIndex));
    }
  }
}
