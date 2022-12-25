import { LandmarkConnectionArray, NormalizedLandmark, NormalizedLandmarkList } from '@mediapipe/pose';
import {
  AxesHelper,
  BufferGeometry,
  Camera,
  Color,
  GridHelper,
  Group,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const landmarkToVector3 = (point: NormalizedLandmark): Vector3 => new Vector3(point.x, point.y, point.z);

export type CameraAngle = {
  theta: number;
  phi: number;
};

export type PoseGridConfig = {
  backgroundColor: number;
  camera: { projectionMode: 'perspective' | 'parallel'; distance: number; fov: number };
  cameraTarget: Vector3;
  gridPlane: { size: number; divisions: number; y: number };
  connectionColor: number;
  connectionWidth: number;
  landmarkColor: number;
  landmarkSize: number;
};

export const DEFAULT_POSE_GRID_CONFIG: PoseGridConfig = {
  backgroundColor: 0,
  camera: { projectionMode: 'perspective', distance: 250, fov: 60 },
  cameraTarget: new Vector3(0, 0, 0),
  gridPlane: { size: 200, divisions: 10, y: 0 },
  connectionWidth: 4,
  connectionColor: 0x00ffff,
  landmarkSize: 2,
  landmarkColor: 0xaaaaaa,
};

export class PoseGrid {
  config: PoseGridConfig;
  parentBox: DOMRect;
  disposeQueue: Array<BufferGeometry>;
  removeQueue: Array<Object3D>;
  canvas: HTMLCanvasElement;
  container: HTMLDivElement;
  camera: Camera;
  renderer: WebGLRenderer;
  scene: Scene;
  orbitControls: OrbitControls;
  landmarkGeometry: BufferGeometry;
  landmarkMaterial: Material;
  landmarkGroup: Group;
  connectionMaterial: Material;
  connectionGroup: Group;
  cylinderGroup: Group;
  guidelineGroup: Group;
  isAutoRotating: boolean;
  phiForAutoRotation: number;

  constructor(parent: HTMLElement, config = DEFAULT_POSE_GRID_CONFIG) {
    this.config = { ...DEFAULT_POSE_GRID_CONFIG, ...config };
    this.disposeQueue = [];
    this.removeQueue = [];
    this.container = document.createElement('div');
    this.container.classList.add('viewer-widget-js');
    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
    parent.appendChild(this.container);
    this.parentBox = parent.getBoundingClientRect();
    if (this.config.camera.projectionMode === 'parallel') {
      this.camera = new OrthographicCamera(
        -this.config.camera.distance * 0.7,
        this.config.camera.distance * 0.7,
        this.config.camera.distance * 0.7,
        -this.config.camera.distance * 0.7,
      );
    } else {
      this.camera = new PerspectiveCamera(this.config.camera.fov, this.parentBox.width / this.parentBox.height, 1);
    }
    this.camera.lookAt(this.config.cameraTarget);
    this.renderer = new WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(new Color(this.config.backgroundColor), 0.5);
    this.renderer.setSize(Math.floor(this.parentBox.width), Math.floor(this.parentBox.height));
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
    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.2;
    this.orbitControls.target = this.config.cameraTarget;

    this.landmarkMaterial = new MeshBasicMaterial({ color: this.config.landmarkColor });
    this.landmarkGeometry = new SphereGeometry(this.config.landmarkSize);
    this.connectionMaterial = new LineBasicMaterial({
      color: this.config.connectionColor,
      linewidth: this.config.connectionWidth,
    });

    const { size, divisions, y } = this.config.gridPlane;
    const gridPlane = new GridHelper(size, divisions);
    gridPlane.translateY(y); // translate grid plane on foot height

    // カメラ自動回転
    this.isAutoRotating = false;
    this.phiForAutoRotation = 0;

    this.scene.add(gridPlane);
    this.landmarkGroup = new Group();
    this.scene.add(this.landmarkGroup);
    this.cylinderGroup = new Group();
    this.guidelineGroup = new Group();
    this.scene.add(this.guidelineGroup);
    this.connectionGroup = new Group();
    this.scene.add(this.connectionGroup);

    const axesHelper = new AxesHelper(50);
    this.scene.add(axesHelper);
    this.requestFrame();
  }

  updateOrbitControls(): void {
    window.requestAnimationFrame((): void => {
      this.orbitControls.update();
      this.renderer.render(this.scene, this.camera);
    });
    // カメラの回転;
    if (this.isAutoRotating) {
      this.phiForAutoRotation += 0.7;
      this.setCameraPosition({ theta: 90, phi: this.phiForAutoRotation });
    }
  }

  requestFrame(): void {
    window.requestAnimationFrame((): void => {
      this.renderer.render(this.scene, this.camera);
    });
  }

  /**
   * @public: カメラ位置を三次元極座標（角度は度数法）で指定する
   */
  // Default parameters are set so that the grid is viewed from the side
  // TODO: rename as setCameraPosition
  setCameraPosition(cameraAngle: CameraAngle = { theta: 90, phi: 0 }): void {
    const { theta, phi } = cameraAngle;
    const thetaRad = (theta * Math.PI) / 180;
    const phiRad = (phi * Math.PI) / 180;
    this.camera.position.x = Math.sin(thetaRad) * Math.cos(phiRad) * this.config.camera.distance;
    this.camera.position.z = Math.sin(thetaRad) * Math.sin(phiRad) * this.config.camera.distance;
    this.camera.position.y = Math.cos(thetaRad) * this.config.camera.distance + this.config.cameraTarget.y;
    this.camera.lookAt(this.config.cameraTarget);
  }

  /**
   * @public: Update the landmarks coordinates in OnResults callback.
   */
  updateLandmarks(landmarks: NormalizedLandmarkList, connections: LandmarkConnectionArray): void {
    this.clearResources();
    this.drawBones(landmarks, connections);
    const meshLength: number = this.landmarkGroup.children.length;
    if (meshLength < landmarks.length) {
      for (let i = meshLength; i < landmarks.length; i += 1) {
        this.landmarkGroup.add(new Mesh(this.landmarkGeometry));
      }
    } else if (meshLength > landmarks.length) {
      for (let i = landmarks.length; i < meshLength; i += 1) {
        this.landmarkGroup.remove(this.landmarkGroup.children[i]);
      }
    }
    this.drawLandmarks(landmarks);

    // カメラの回転;
    if (this.isAutoRotating) {
      this.phiForAutoRotation += 0.7;
      this.setCameraPosition({ theta: 90, phi: this.phiForAutoRotation });
    }

    this.requestFrame();
  }

  clearResources(): void {
    this.connectionGroup.clear();
    this.cylinderGroup.clear();
    this.removeQueue.forEach((object3D): void => {
      if (object3D.parent) object3D.parent.remove(object3D);
    });
    this.removeQueue = [];
    this.disposeQueue.forEach((bufferGeometry): void => {
      bufferGeometry.dispose();
    });
    this.disposeQueue = [];
  }

  drawLandmarks(landmarks: NormalizedLandmarkList): void {
    for (let i = 0; i < landmarks.length; i += 1) {
      const sphere: Mesh = this.landmarkGroup.children[i] as Mesh;
      sphere.material = this.landmarkMaterial;
      sphere.position.copy(landmarkToVector3(landmarks[i]));
    }
  }

  drawBones(landmarks: NormalizedLandmarkList, connections: LandmarkConnectionArray): void {
    const color: Material = this.connectionMaterial;
    const lines: Array<Vector3> = [];
    connections.forEach((connection): void => {
      lines.push(landmarkToVector3(landmarks[connection[0]]));
      lines.push(landmarkToVector3(landmarks[connection[1]]));
    });
    const geometry: BufferGeometry = new BufferGeometry().setFromPoints(lines);
    this.disposeQueue.push(geometry);
    const wireFrame: LineSegments = new LineSegments(geometry, color);
    this.removeQueue.push(wireFrame);
    this.connectionGroup.add(wireFrame);
  }
}

export function PoseGridView(props: {
  divRef: React.MutableRefObject<HTMLDivElement | null>;
  style: React.CSSProperties;
}) {
  const { divRef, style } = props;

  return (
    <div className="square-box" style={style}>
      <div
        className="pose-grid-container"
        ref={divRef}
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          top: 0,
          left: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />
    </div>
  );
}
