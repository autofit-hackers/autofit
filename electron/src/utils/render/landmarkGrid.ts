import { NormalizedLandmark } from '@mediapipe/pose';
import {
  BufferGeometry,
  Color,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneBufferGeometry,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { copyLandmark } from '../../training/pose';
/**
 * ViewerWidget configuration and its default value.
 */
export type ViewerWidgetConfig = {
  backgroundColor: number;
  fovInDegrees: number;
  shouldAddPausePlay: boolean;
};

const DEFAULT_VIEWER_WIDGET_CONFIG: ViewerWidgetConfig = {
  backgroundColor: 0,
  fovInDegrees: 75,
  shouldAddPausePlay: false,
};

/**
 * Configuration for the landmark grid and its default value.
 */
export type LandmarkGridConfig = {
  axesColor: number;
  axesWidth: number;
  shouldSetLabels: boolean;
  /**
   * The "centered" attribute describes whether the grid should use the center
   * of the bounding box of the landmarks as the origin.
   */
  centered: boolean;
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

export type GridCameraAngle = {
  theta: number;
  phi: number;
  distance: number;
};

const DEFAULT_LANDMARK_GRID_CONFIG: LandmarkGridConfig = {
  axesColor: 0xffffff,
  axesWidth: 2,
  shouldSetLabels: false,
  centered: false,
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
 *
 */
type NumberLabel = { element: HTMLElement; position: Vector3; value: number };

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
export class LandmarkGrid {
  // Extended properties from ViewerWidget
  distance: number;
  rotation: number;
  disposeQueue: Array<BufferGeometry>;
  removeQueue: Array<Object3D>;
  viewerWidgetConfig: ViewerWidgetConfig;
  container: HTMLDivElement;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  scene: Scene;
  controls: OrbitControls;

  // Original properties
  size: number;
  landmarks: Array<NormalizedLandmark>;
  labels: { x: NumberLabel[]; y: NumberLabel[]; z: NumberLabel[] };
  landmarkGroup: Group;
  connectionGroup: Group;
  origin: Vector3;
  landmarkGridConfig: LandmarkGridConfig;
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
  constructor(
    parent: HTMLElement,
    viewerWidgetConfig: ViewerWidgetConfig = DEFAULT_VIEWER_WIDGET_CONFIG,
    landmarkGridConfig = DEFAULT_LANDMARK_GRID_CONFIG,
  ) {
    /*
     * Set viewerWidgetConfig
     */
    this.distance = 100;
    this.rotation = 0;
    this.disposeQueue = [];
    this.removeQueue = [];
    this.viewerWidgetConfig = { ...DEFAULT_VIEWER_WIDGET_CONFIG, ...viewerWidgetConfig };
    this.container = document.createElement('div');
    this.container.classList.add('viewer-widget-js');
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    this.container.appendChild(canvas);
    parent.appendChild(this.container);
    const parentBox: DOMRect = parent.getBoundingClientRect();
    if (this.viewerWidgetConfig.shouldAddPausePlay) {
      this.addPausePlay();
    }
    this.camera = new PerspectiveCamera(this.viewerWidgetConfig.fovInDegrees, parentBox.width / parentBox.height, 1);
    this.camera.position.z = this.distance;
    this.camera.lookAt(new Vector3());
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(new Color(this.viewerWidgetConfig.backgroundColor), 0.5);
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
    this.controls = new OrbitControls(this.camera, canvas);
    // 滑らかにカメラコントローラーを制御する
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.2;

    /*
     * Set landmarkGridConfig
     */
    this.landmarkGridConfig = landmarkGridConfig;
    this.size = 100;
    this.landmarks = [];
    this.landmarkMaterial = new MeshBasicMaterial({ color: this.landmarkGridConfig.landmarkColor });
    this.landmarkGeometry = new SphereGeometry(this.landmarkGridConfig.landmarkSize);
    this.nonvisibleMaterial = new MeshBasicMaterial({ color: this.landmarkGridConfig.nonvisibleLandmarkColor });
    this.axesMaterial = new LineBasicMaterial({
      color: this.landmarkGridConfig.axesColor,
      linewidth: this.landmarkGridConfig.axesWidth,
    });
    this.gridMaterial = new LineBasicMaterial({ color: 0x999999 });
    this.connectionMaterial = new LineBasicMaterial({
      color: this.landmarkGridConfig.connectionColor,
      linewidth: this.landmarkGridConfig.connectionWidth,
    });
    this.isVisible = (normalizedLandmark: NormalizedLandmark): boolean =>
      normalizedLandmark.visibility === undefined ||
      (!!normalizedLandmark.visibility && normalizedLandmark.visibility > this.landmarkGridConfig.minVisibility);
    this.definedColors = {};
    this.landmarkGridConfig.definedColors.forEach((color) => {
      this.definedColors[color.name] = new LineBasicMaterial({
        color: color.value,
        linewidth: this.landmarkGridConfig.connectionWidth,
      });
    });
    this.landmarkGridConfig.definedColors.forEach((color) => {
      this.definedColors[color.name] = new LineBasicMaterial({
        color: color.value,
        linewidth: this.landmarkGridConfig.connectionWidth,
      });
    });
    this.sizeWhenFitted = 1 - 2 * this.landmarkGridConfig.margin;

    /*
     * Generate the grid and viewed materials
     */
    this.drawAxes();
    this.labels = this.createAxesLabels();
    this.landmarkGroup = new Group();
    this.scene.add(this.landmarkGroup);
    this.connectionGroup = new Group();
    this.scene.add(this.connectionGroup);
    this.origin = new Vector3();
    this.requestFrame();
  }

  /**
   * @private:
   */
  requestFrame(): void {
    window.requestAnimationFrame((): void => {
      this.renderer.render(this.scene, this.camera);
      // Set labels
      this.labels.x.forEach((pair: NumberLabel) => {
        const position: Vector3 = this.getCanvasPosition(pair.position);
        // eslint-disable-next-line no-param-reassign
        pair.element.style.transform = `translate(${position.x}px, ${position.y}px)`;
      });
      this.labels.y.forEach((pair: NumberLabel) => {
        const position: Vector3 = this.getCanvasPosition(pair.position);
        // eslint-disable-next-line no-param-reassign
        pair.element.style.transform = `translate(${position.x}px, ${position.y}px)`;
      });
      this.labels.z.forEach((pair: NumberLabel) => {
        const position: Vector3 = this.getCanvasPosition(pair.position);
        // eslint-disable-next-line no-param-reassign
        pair.element.style.transform = `translate(${position.x}px, ${position.y}px)`;
      });
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
  setCamera(theta: number, phi: number, distance = 150): void {
    const thetaRad = (theta * Math.PI) / 180;
    const phiRad = (phi * Math.PI) / 180;
    this.camera.position.x = Math.sin(thetaRad) * Math.cos(phiRad) * distance;
    this.camera.position.z = Math.sin(thetaRad) * Math.sin(phiRad) * distance;
    this.camera.position.y = Math.cos(thetaRad) * distance;
    this.camera.lookAt(new Vector3());
    this.controls.update();
  }

  /**
   * @private: (in constructor)
   */
  addPausePlay(): void {
    const PAUSE_SRC =
      'https://fonts.gstatic.com/s/i/googlematerialicons/pause/v14/white-24dp/1x/gm_pause_white_24dp.png';
    const PLAY_SRC =
      'https://fonts.gstatic.com/s/i/googlematerialicons/play_arrow/v14/white-24dp/1x/gm_play_arrow_white_24dp.png';

    const button: HTMLImageElement = document.createElement('img');
    button.classList.add('controls');
    this.container.appendChild(button);
  }

  /**
   * @private: Draw axes of the grid.(in constructor)
   */
  drawAxes(): void {
    const axes: Group = new Group();
    const HALF_SIZE: number = this.size / 2;
    const grid: Group = this.makeGrid(this.size, this.landmarkGridConfig.numCellsPerAxis);
    const xGrid: Group = grid;
    const yGrid: Object3D = grid.clone();
    const zGrid: Object3D = grid.clone();
    xGrid.translateX(-HALF_SIZE);
    xGrid.rotateY(Math.PI / 2);
    yGrid.translateY(-HALF_SIZE);
    yGrid.rotateX(Math.PI / 2);
    axes.add(yGrid);
    zGrid.translateZ(-HALF_SIZE);
    this.scene.add(axes);
  }

  /**
   * @private: Generate Grid.(in drawAxis in constructor)
   */
  makeGrid(size: number, numSteps: number): Group {
    const grid: Group = new Group();
    const plane: PlaneBufferGeometry = new PlaneGeometry(size, size);
    const edges: EdgesGeometry = new EdgesGeometry(plane);
    const wireFrame: LineSegments = new LineSegments(edges, this.gridMaterial);
    grid.add(wireFrame);
    const stepPlaneSize: number = size / numSteps;
    const stepPlane: PlaneBufferGeometry = new PlaneGeometry(stepPlaneSize, stepPlaneSize);
    const stepEdges: EdgesGeometry = new EdgesGeometry(stepPlane);
    const corner: number = -size / 2 + stepPlaneSize / 2;
    for (let i = 0; i < numSteps; i += 1) {
      for (let j = 0; j < numSteps; j += 1) {
        const stepFrame: LineSegments = new LineSegments(stepEdges, this.gridMaterial);
        stepFrame.translateX(corner + i * stepPlaneSize);
        stepFrame.translateY(corner + j * stepPlaneSize);
        grid.add(stepFrame);
      }
    }

    return grid;
  }

  /**
   * @private: Creates a label for the axes.(in constructor)
   */
  createAxesLabels(): { x: Array<NumberLabel>; y: Array<NumberLabel>; z: Array<NumberLabel> } {
    const labels: { x: Array<NumberLabel>; y: Array<NumberLabel>; z: Array<NumberLabel> } = {
      x: [],
      y: [],
      z: [],
    };
    const cellsPerAxis: number = this.landmarkGridConfig.numCellsPerAxis;
    const { range } = this.landmarkGridConfig;
    const HALF_SIZE: number = this.size / 2;
    for (let i = 0; i < cellsPerAxis; i += 1) {
      // X labels
      // This for vector adds one to the count as it covers numCellsPerAxis-1
      // points on the x-axis. The point not covered is where the y-axis meets
      // the x-axis.
      const xValue: number = ((i + 1) / cellsPerAxis - 0.5) * range;
      labels.x.push({
        position: new Vector3(((i + 1) / cellsPerAxis) * this.size - HALF_SIZE, -HALF_SIZE, HALF_SIZE),
        element: this.createLabel(xValue),
        value: xValue,
      });
      // Z labels
      // This vector covers numCellsPerAxis-1 points on the z-axis. The point
      // not covered is where the z-axis meets the x-axis.
      const zValue: number = (i / cellsPerAxis - 0.5) * range;
      labels.z.push({
        position: new Vector3(HALF_SIZE, -HALF_SIZE, (i / cellsPerAxis) * this.size - HALF_SIZE),
        element: this.createLabel(zValue),
        value: zValue,
      });
    }
    // Y labels
    // This for loop covers all points on the y-axis
    for (let i = 0; i <= cellsPerAxis; i += 1) {
      const yValue: number = (i / cellsPerAxis - 0.5) * range;
      labels.y.push({
        position: new Vector3(-HALF_SIZE, (i / cellsPerAxis) * this.size - HALF_SIZE, HALF_SIZE),
        element: this.createLabel(yValue),
        value: yValue,
      });
    }

    return labels;
  }

  /**
   * @private:
   */
  createLabel(value: number): HTMLSpanElement {
    const span: HTMLSpanElement = document.createElement('span');
    span.classList.add('landmark-label-js');
    if (this.landmarkGridConfig.shouldSetLabels) {
      this.setLabel(span, value);
    }
    this.container.appendChild(span);

    return span;
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
    if (this.landmarkGridConfig.centered) {
      this.centralizeLandmarks(centeredLandmarks);
    }
    // Fit to grid if necessary
    let scalingFactor = 1;
    if (this.landmarkGridConfig.fitToGrid) {
      const rawScalingFactor: number = this.getFitToGridFactor(centeredLandmarks);
      const RESCALE = 0.5;
      const { range } = this.landmarkGridConfig;
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
    if (this.landmarkGridConfig.shouldSetLabels) {
      this.labels.x.forEach((label: NumberLabel) => {
        this.setLabel(label.element, (label.value - this.origin.x) / scalingFactor);
      });
      this.labels.y.forEach((label: NumberLabel) => {
        this.setLabel(label.element, (label.value - this.origin.y) / scalingFactor);
      });
      this.labels.z.forEach((label: NumberLabel) => {
        this.setLabel(label.element, (label.value - this.origin.z) / scalingFactor);
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

  /**
   * @private: Sets the label text.
   */
  setLabel(span: HTMLSpanElement, value: number): void {
    // eslint-disable-next-line no-param-reassign
    span.textContent =
      this.landmarkGridConfig.labelPrefix + value.toPrecision(2).toString() + this.landmarkGridConfig.labelSuffix;
  }

  drawLandmarks(landmarkVectors: Vector3[]): void {
    for (let i = 0; i < this.landmarks.length; i += 1) {
      const visible: boolean = this.isVisible(this.landmarks[i]);
      let { nonvisibleMaterial } = this;
      if (!this.landmarkGridConfig.showHidden && !visible) {
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
        this.landmarkGridConfig.showHidden ||
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
    return new Vector3(point.x, -point.y, -point.z).multiplyScalar(this.size / this.landmarkGridConfig.range);
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
      factor = Math.min(factor, this.landmarkGridConfig.range / 2 / maxNum);
    }

    return factor * this.sizeWhenFitted;
  }

  /**
   * @private:Relocate landmarks to the grid origin. (in Update)
   */
  centralizeLandmarks(landmarks: Array<NormalizedLandmark>): void {
    if (landmarks.length === 0) {
      return;
    }
    let maxX: number = landmarks[0].x;
    let minX: number = landmarks[0].x;
    let maxY: number = landmarks[0].y;
    let minY: number = landmarks[0].y;
    let maxZ: number = landmarks[0].z;
    let minZ: number = landmarks[0].z;
    for (let i = 1; i < landmarks.length; i += 1) {
      const landmark: NormalizedLandmark = landmarks[i];
      maxX = Math.max(maxX, landmark.x);
      maxY = Math.max(maxY, landmark.y);
      maxZ = Math.max(maxZ, landmark.z);
      minX = Math.min(minX, landmark.x);
      minY = Math.min(minY, landmark.y);
      minZ = Math.min(minZ, landmark.z);
    }
    const centerX: number = (maxX + minX) / 2;
    const centerY: number = (maxY + minY) / 2;
    const centerZ: number = (maxZ + minZ) / 2;
    for (let i = 0; i < this.landmarks.length; i += 1) {
      this.landmarks[i].x -= centerX;
      this.landmarks[i].y -= centerY;
      this.landmarks[i].z -= centerZ;
    }
    this.origin.set(centerX, centerY, centerZ);
  }
}
