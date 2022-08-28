import { LandmarkConnectionArray, NormalizedLandmark } from '@mediapipe/pose';
// eslint-disable-next-line import/no-unresolved
import BaseReactPlayer, { BaseReactPlayerProps } from 'react-player/base';
import {
  BufferGeometry,
  Color,
  CylinderGeometry,
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
import { copyLandmark, KINECT_POSE_CONNECTIONS, landmarkToVector } from '../training_data/pose';

import { Set } from '../training_data/set';

export type LineEndPoints = {
  from: { x: number; y: number; z: number };
  to: { x: number; y: number; z: number };
};

type SquareCorners = {
  1: { x: number; y: number; z: number };
  2: { x: number; y: number; z: number };
  3: { x: number; y: number; z: number };
  4: { x: number; y: number; z: number };
};

export type GuidelineSymbols = {
  lines?: LineEndPoints[];
  spheres?: { x: number; y: number; z: number }[];
  squares?: SquareCorners[]; // should have 4 points
};

export type CameraAngle = {
  theta: number;
  phi: number;
};

export type PoseGridConfig = {
  backgroundColor: number;
  cameraDistance: number;
  cameraFov: number;
  connectionColor: number;
  connectionWidth: number;
  landmarkColor: number;
  landmarkSize: number;
};

const DEFAULT_POSE_GRID_CONFIG: PoseGridConfig = {
  backgroundColor: 0,
  cameraDistance: 200,
  cameraFov: 75,
  connectionWidth: 4,
  connectionColor: 0x00ffff,
  landmarkSize: 2,
  landmarkColor: 0xaaaaaa,
};

export class PoseGrid {
  poseGridConfig: PoseGridConfig;
  parentBox: DOMRect;
  disposeQueue: Array<BufferGeometry>;
  removeQueue: Array<Object3D>;
  container: HTMLDivElement;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  scene: Scene;
  orbitControls: OrbitControls;
  landmarks: Array<NormalizedLandmark>;
  landmarkGeometry: BufferGeometry;
  landmarkMaterial: Material;
  landmarkGroup: Group;
  connectionMaterial: Material;
  connectionGroup: Group;
  cylinderGroup: Group;

  constructor(parent: HTMLElement, poseGridConfig = DEFAULT_POSE_GRID_CONFIG) {
    this.poseGridConfig = poseGridConfig;
    this.disposeQueue = [];
    this.removeQueue = [];
    this.container = document.createElement('div');
    this.container.classList.add('viewer-widget-js');
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    this.container.appendChild(canvas);
    parent.appendChild(this.container);
    this.parentBox = parent.getBoundingClientRect();
    this.camera = new PerspectiveCamera(
      this.poseGridConfig.cameraFov,
      this.parentBox.width / this.parentBox.height,
      1,
    );
    this.camera.lookAt(new Vector3());
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(new Color(this.poseGridConfig.backgroundColor), 0.5);
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
    this.orbitControls = new OrbitControls(this.camera, canvas);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.2;

    this.landmarks = [];
    this.landmarkMaterial = new MeshBasicMaterial({ color: this.poseGridConfig.landmarkColor });
    this.landmarkGeometry = new SphereGeometry(this.poseGridConfig.landmarkSize);
    this.connectionMaterial = new LineBasicMaterial({
      color: this.poseGridConfig.connectionColor,
      linewidth: this.poseGridConfig.connectionWidth,
    });

    const gridPlane = new GridHelper(300, 10);
    gridPlane.translateY(-93); // translate grid plane on foot height

    this.scene.add(gridPlane);
    this.landmarkGroup = new Group();
    this.scene.add(this.landmarkGroup);
    this.cylinderGroup = new Group();
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

  /**
   * @public: カメラ位置を三次元極座標（角度は度数法）で指定する
   */
  // Default parameters are set so that the grid is viewed from the side
  // TODO: rename
  setCameraAngle(cameraAngle: CameraAngle = { theta: 90, phi: 0 }): void {
    const { theta, phi } = cameraAngle;
    const thetaRad = (theta * Math.PI) / 180;
    const phiRad = (phi * Math.PI) / 180;
    this.camera.position.x = Math.sin(thetaRad) * Math.cos(phiRad) * this.poseGridConfig.cameraDistance;
    this.camera.position.z = Math.sin(thetaRad) * Math.sin(phiRad) * this.poseGridConfig.cameraDistance;
    this.camera.position.y = Math.cos(thetaRad) * this.poseGridConfig.cameraDistance;
    this.camera.lookAt(new Vector3());
  }

  /**
   * @public: Update the landmarks coordinates in OnResults callback.
   */
  updateLandmarks(
    landmarks: NormalizedLandmark[],
    connections: LandmarkConnectionArray,
    guideSymbols?: GuidelineSymbols,
  ): void {
    this.connectionGroup.clear();
    this.cylinderGroup.clear();
    this.clearResources();
    this.landmarks = landmarks.map(copyLandmark);
    const landmarkVectors: Array<Vector3> = this.landmarks.map(
      (normalizedLandmark: NormalizedLandmark): Vector3 => landmarkToVector(normalizedLandmark),
    );
    this.drawConnections(landmarkVectors, connections);
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

    // ガイドラインの描画
    if (guideSymbols) {
      this.drawGuideline(guideSymbols);
    }

    this.requestFrame();
  }

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
      const sphere: Mesh = this.landmarkGroup.children[i] as Mesh;
      sphere.material = this.landmarkMaterial;
      sphere.position.copy(landmarkVectors[i]);
    }
  }

  drawLine(guideLinePair: LineEndPoints): void {
    const color: Material = this.connectionMaterial;
    const from = landmarkToVector(guideLinePair.from);
    const to = landmarkToVector(guideLinePair.to);
    const lines: Array<Vector3> = [from, to];
    const geometry: BufferGeometry = new BufferGeometry().setFromPoints(lines);
    this.disposeQueue.push(geometry);
    const wireFrame: LineSegments = new LineSegments(geometry, color);
    this.removeQueue.push(wireFrame);
    this.connectionGroup.add(wireFrame);
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
      });
    }
  }

  drawConnections(landmarks: Array<Vector3>, connections: LandmarkConnectionArray): void {
    const color: Material = this.connectionMaterial;
    const lines: Array<Vector3> = [];
    connections.forEach((connection): void => {
      lines.push(landmarks[connection[0]]);
      lines.push(landmarks[connection[1]]);
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
