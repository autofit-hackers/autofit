import { LandmarkConnectionArray, NormalizedLandmarkList } from '@mediapipe/pose';
// eslint-disable-next-line import/no-unresolved
import BaseReactPlayer, { BaseReactPlayerProps } from 'react-player/base';
import {
  BufferGeometry,
  Camera,
  Color,
  CylinderGeometry,
  OrthographicCamera,
  GridHelper,
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
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { KINECT_POSE_CONNECTIONS, landmarkToVector3 } from '../training_data/pose';

import { Set } from '../training_data/set';

export type LineEndPoints = {
  from: Vector3;
  to: Vector3;
};

type SquareCorners = {
  1: Vector3;
  2: Vector3;
  3: Vector3;
  4: Vector3;
};

export type GuidelineSymbols = {
  lines?: LineEndPoints[];
  spheres?: Vector3[];
  squares?: SquareCorners[]; // should have 4 points
};

export type CameraAngle = {
  theta: number;
  phi: number;
};

export type PoseGridConfig = {
  backgroundColor: number;
  camera: { useOrthographic: boolean; distance: number; fov: number };
  gridPlane: { size: number; divisions: number; y: number };
  connectionColor: number;
  connectionWidth: number;
  landmarkColor: number;
  landmarkSize: number;
};

const DEFAULT_POSE_GRID_CONFIG: PoseGridConfig = {
  backgroundColor: 0,
  camera: { useOrthographic: true, distance: 200, fov: 75 },
  gridPlane: { size: 200, divisions: 10, y: -93 },
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

  constructor(parent: HTMLElement, config = DEFAULT_POSE_GRID_CONFIG) {
    this.config = config;
    this.disposeQueue = [];
    this.removeQueue = [];
    this.container = document.createElement('div');
    this.container.classList.add('viewer-widget-js');
    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
    parent.appendChild(this.container);
    this.parentBox = parent.getBoundingClientRect();
    if (this.config.camera.useOrthographic) {
      this.camera = new OrthographicCamera(
        -this.config.camera.distance * 0.7,
        this.config.camera.distance * 0.7,
        this.config.camera.distance * 0.7,
        -this.config.camera.distance * 0.7,
      );
    } else {
      this.camera = new PerspectiveCamera(this.config.camera.fov, this.parentBox.width / this.parentBox.height, 1);
    }
    this.camera.lookAt(new Vector3());
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

    this.landmarkMaterial = new MeshBasicMaterial({ color: this.config.landmarkColor });
    this.landmarkGeometry = new SphereGeometry(this.config.landmarkSize);
    this.connectionMaterial = new LineBasicMaterial({
      color: this.config.connectionColor,
      linewidth: this.config.connectionWidth,
    });

    const { size, divisions, y } = this.config.gridPlane;
    const gridPlane = new GridHelper(size, divisions);
    gridPlane.translateY(y); // translate grid plane on foot height

    this.scene.add(gridPlane);
    this.landmarkGroup = new Group();
    this.scene.add(this.landmarkGroup);
    this.cylinderGroup = new Group();
    this.guidelineGroup = new Group();
    this.scene.add(this.guidelineGroup);
    this.connectionGroup = new Group();
    this.scene.add(this.connectionGroup);
    this.requestFrame();
  }

  updateOrbitControls(): void {
    window.requestAnimationFrame((): void => {
      this.orbitControls.update();
      this.renderer.render(this.scene, this.camera);
    });
  }

  requestFrame(): void {
    window.requestAnimationFrame((): void => {
      this.renderer.render(this.scene, this.camera);
    });
  }

  changeCameraType(): void {
    const prevCameraPosition = this.camera.position.clone();
    if (this.camera instanceof PerspectiveCamera) {
      this.camera = new OrthographicCamera(
        -this.config.camera.distance * 0.7,
        this.config.camera.distance * 0.7,
        this.config.camera.distance * 0.7,
        -this.config.camera.distance * 0.7,
      );
    } else {
      this.camera = new PerspectiveCamera(this.config.camera.fov, this.parentBox.width / this.parentBox.height, 1);
    }
    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.2;
    this.camera.position.set(prevCameraPosition.x, prevCameraPosition.y, prevCameraPosition.z);
    this.camera.lookAt(new Vector3());
  }

  /**
   * @public: カメラ位置を三次元極座標（角度は度数法）で指定する
   */
  // Default parameters are set so that the grid is viewed from the side
  // TODO: rename
  setCameraAngle(cameraAngle: CameraAngle = { theta: 90, phi: 0 }): void {
    const { theta, phi } = cameraAngle;
    const thetaRad = (theta * Math.PI) / 180;
    const phiRad = (phi * Math.PI) / 180;
    this.camera.position.x = Math.sin(thetaRad) * Math.cos(phiRad) * this.config.camera.distance;
    this.camera.position.z = Math.sin(thetaRad) * Math.sin(phiRad) * this.config.camera.distance;
    this.camera.position.y = Math.cos(thetaRad) * this.config.camera.distance;
    this.camera.lookAt(new Vector3());
  }

  /**
   * @public: Update the landmarks coordinates in OnResults callback.
   */
  updateLandmarks(
    landmarks: NormalizedLandmarkList,
    connections: LandmarkConnectionArray,
    guideSymbols?: GuidelineSymbols,
  ): void {
    this.clearResources();
    this.drawConnections(landmarks, connections);
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

    // ガイドラインの描画
    if (guideSymbols) {
      this.drawGuideline(guideSymbols);
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

  drawLine(lineEndPoints: LineEndPoints, color: Color = new Color(0xff0000)): void {
    const material = new MeshBasicMaterial({ color });
    const { from, to } = lineEndPoints;
    const lines: Array<Vector3> = [from, to];
    const geometry: BufferGeometry = new BufferGeometry().setFromPoints(lines);
    const wireFrame: LineSegments = new LineSegments(geometry, material);
    this.guidelineGroup.add(wireFrame);
  }

  drawLineEndPoints(lineEndPoints: LineEndPoints, color: Color = new Color(0xff0000)): void {
    const material = new MeshBasicMaterial({ color });
    const sphereGeometry = new SphereGeometry(this.config.landmarkSize);

    const lineEndPointArray: Array<Vector3> = [lineEndPoints.from, lineEndPoints.to];
    lineEndPointArray.forEach((point): void => {
      const sphere: Mesh = new Mesh(sphereGeometry, material);
      sphere.position.copy(point);
      this.guidelineGroup.add(sphere);
    });
  }

  drawCylinder(from: Vector3, to: Vector3): void {
    const center = from.add(to).multiplyScalar(0.5);
    const distance = from.distanceTo(to);
    const geometry = new CylinderGeometry(0.5, 0.5, distance, 32);
    const material = new MeshBasicMaterial({ color: 0xffff00 });
    const cylinder = new Mesh(geometry, material);
    cylinder.position.copy(center);
    this.cylinderGroup.add(cylinder);
  }

  drawGuideline(guidelineSymbols: GuidelineSymbols): void {
    if ('lines' in guidelineSymbols) {
      guidelineSymbols.lines?.forEach((linePair) => {
        this.drawLine(linePair);
        this.drawLineEndPoints(linePair);
      });
    }
  }

  drawConnections(landmarks: NormalizedLandmarkList, connections: LandmarkConnectionArray): void {
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
