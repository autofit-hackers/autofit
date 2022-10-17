import { LandmarkConnectionArray, NormalizedLandmarkList } from '@mediapipe/pose';
// eslint-disable-next-line import/no-unresolved
import BaseReactPlayer, { BaseReactPlayerProps } from 'react-player/base';
import {
  BufferGeometry,
  Camera,
  Color,
  CylinderGeometry,
  DoubleSide,
  GridHelper,
  Group,
  LineBasicMaterial,
  LineSegments,
  Material,
  Matrix3,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Rep } from '../training_data/rep';
import { KINECT_POSE_CONNECTIONS, landmarkToVector3 } from '../training_data/pose';

import { Set } from '../training_data/set';

// TODO: オブジェクトごとに色を設定できるようにする
export type LineEndPoints = {
  from: Vector3;
  to: Vector3;
  showEndPoints: boolean;
};

type SquareCorners = {
  topLeft: Vector3;
  topRight: Vector3;
  bottomLeft: Vector3;
  bottomRight: Vector3;
};

type Square = {
  width: number;
  height: number;
  center: Vector3;
};

export const cornerPointsToSquare = (corners: SquareCorners): Square => {
  const { topLeft, topRight, bottomLeft, bottomRight } = corners;
  // Check that the given 4 points are on the same plane
  const topLeftToBottomRight = new Vector3().subVectors(bottomRight, topLeft);
  const topLeftToBottomLeft = new Vector3().subVectors(bottomLeft, topLeft);
  const topLeftToTopRight = new Vector3().subVectors(topRight, topLeft);

  const matrix = new Matrix3().set(
    topLeftToBottomRight.x,
    topLeftToBottomRight.y,
    topLeftToBottomRight.z,
    topLeftToBottomLeft.x,
    topLeftToBottomLeft.y,
    topLeftToBottomLeft.z,
    topLeftToTopRight.x,
    topLeftToTopRight.y,
    topLeftToTopRight.z,
  );
  if (matrix.determinant() !== 0) {
    console.error('The given 4 points are not on the same plane');

    return { width: 0, height: 0, center: new Vector3() };
  }

  const width = topLeft.distanceTo(topRight);
  const height = topRight.distanceTo(bottomRight);
  const center = new Vector3().addVectors(topLeft, bottomRight).divideScalar(2);

  return { width, height, center };
};

export type GuidelineSymbols = {
  points?: Vector3[];
  lines?: LineEndPoints[];
  spheres?: Vector3[];
  squares?: SquareCorners[];
};

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
  camera: { projectionMode: 'parallel', distance: 200, fov: 75 },
  cameraTarget: new Vector3(0, 93, 0),
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
      this.setCameraAngle({ theta: 90, phi: this.phiForAutoRotation });
    }
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
    this.orbitControls.target = this.config.cameraTarget;
    this.camera.position.set(prevCameraPosition.x, prevCameraPosition.y, prevCameraPosition.z);
    this.camera.lookAt(this.config.cameraTarget);
  }

  /**
   * @public: カメラ位置を三次元極座標（角度は度数法）で指定する
   */
  // Default parameters are set so that the grid is viewed from the side
  // TODO: rename as setCameraPosition
  setCameraAngle(cameraAngle: CameraAngle = { theta: 90, phi: 0 }): void {
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

    // カメラの回転;
    if (this.isAutoRotating) {
      this.phiForAutoRotation += 0.7;
      this.setCameraAngle({ theta: 90, phi: this.phiForAutoRotation });
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

  drawPoint(point: Vector3, color: Color = new Color('#e53935')): void {
    const material = new MeshBasicMaterial({ color });
    const sphereGeometry = new SphereGeometry(this.config.landmarkSize);

    const sphere = new Mesh(sphereGeometry, material);
    sphere.position.copy(point);
    this.guidelineGroup.add(sphere);
  }

  drawLine(lineEndPoints: LineEndPoints, color: Color = new Color('#e53935')): void {
    const material = new MeshBasicMaterial({ color });
    const { from, to } = lineEndPoints;
    const lines: Array<Vector3> = [from, to];
    const geometry: BufferGeometry = new BufferGeometry().setFromPoints(lines);
    const wireFrame: LineSegments = new LineSegments(geometry, material);
    this.guidelineGroup.add(wireFrame);
  }

  drawLineEndPoints(lineEndPoints: LineEndPoints, color: Color = new Color('#e53935')): void {
    const material = new MeshBasicMaterial({ color });
    const sphereGeometry = new SphereGeometry(this.config.landmarkSize);

    const lineEndPointArray: Array<Vector3> = [lineEndPoints.from, lineEndPoints.to];
    lineEndPointArray.forEach((point): void => {
      const sphere: Mesh = new Mesh(sphereGeometry, material);
      sphere.position.copy(point);
      this.guidelineGroup.add(sphere);
    });
  }

  drawSquare(squareCorners: SquareCorners, color: Color = new Color('#e53935')): void {
    const { width, height, center } = cornerPointsToSquare(squareCorners);
    const geometry = new PlaneGeometry(width, height);
    const material = new MeshBasicMaterial({ color, side: DoubleSide });
    const squareMesh = new Mesh(geometry, material);
    squareMesh.position.set(center.x, center.y, center.z);
    this.guidelineGroup.add(squareMesh);
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
    this.guidelineGroup.clear();
    if ('points' in guidelineSymbols) {
      guidelineSymbols.points?.forEach((point): void => {
        this.drawPoint(point);
      });
    }
    if ('lines' in guidelineSymbols) {
      guidelineSymbols.lines?.forEach((linePair) => {
        this.drawLine(linePair);
        if (linePair.showEndPoints) this.drawLineEndPoints(linePair);
      });
    }
    if ('squares' in guidelineSymbols) {
      guidelineSymbols.squares?.forEach((squareCorners) => {
        this.drawSquare(squareCorners);
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

  startLoopPlayback(rep: Rep, currentFrameIndex: number, numAllFrame: number, duration: number): void {
    this.updateLandmarks(rep.form[currentFrameIndex].worldLandmarks, KINECT_POSE_CONNECTIONS);

    setTimeout(() => {
      if (currentFrameIndex === numAllFrame - 1) {
        requestAnimationFrame(() => this.startLoopPlayback(rep, 0, numAllFrame, duration));
      } else {
        requestAnimationFrame(() => this.startLoopPlayback(rep, currentFrameIndex + 1, numAllFrame, duration));
      }
    }, duration / numAllFrame);
  }
}
