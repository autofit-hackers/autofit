import { LandmarkConnectionArray, NormalizedLandmarkList } from '@mediapipe/pose';
import { Button } from '@mui/material';
import { Line, OrbitControls, PerspectiveCamera, Plane, Sphere } from '@react-three/drei';
import { Canvas, Euler, useThree } from '@react-three/fiber';
import { Suspense } from 'react';
import { Vector3 } from 'three';
import { KINECT_POSE_CONNECTIONS, landmarkToVector } from '../../training_data/pose';

type CameraAngle = {
  theta: number;
  phi: number;
};

export type LineEndPoints = {
  from: Vector3;
  to: Vector3;
};

type Square = {
  1: Vector3;
  2: Vector3;
  3: Vector3;
  4: Vector3;
  position: Vector3;
  scale: Vector3;
  rotation: Euler;
};

export type GuidelineSymbols = {
  lines?: LineEndPoints[];
  spheres?: Vector3[];
  squares?: Square[];
};

const calculateCameraPosition = (cameraAngle: CameraAngle): Vector3 => {
  const { theta, phi } = cameraAngle;
  const thetaRad = (theta * Math.PI) / 180;
  const phiRad = (phi * Math.PI) / 180;
  const cameraDistance = 2000; // TODO:  PoseGridViewerのサイズに応じてカメラの距離を調整する
  const x = Math.sin(thetaRad) * Math.cos(phiRad) * cameraDistance;
  const z = Math.sin(thetaRad) * Math.sin(phiRad) * cameraDistance;
  const y = Math.cos(thetaRad) * cameraDistance;

  return new Vector3(x, y, z);
};

function Camera() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 500]} fov={75} near={1} />
      <OrbitControls enablePan enableZoom enableRotate />
    </>
  );
}

function GridStage() {
  return (
    <>
      <Plane rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -90]}>
        <meshBasicMaterial color="#082444" />
      </Plane>
      <gridHelper args={[300, 100, 'red', '#4C4C4C']} />
    </>
  );
}

function Landmarks(props: { landmarks: NormalizedLandmarkList | undefined }) {
  const { landmarks } = props;

  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {landmarks &&
        landmarks.map((landmark) => (
          <Sphere position={landmarkToVector(landmark)}>
            <meshBasicMaterial color="hotpink" />
          </Sphere>
        ))}
    </>
  );
}

function Bones(props: { landmarks: NormalizedLandmarkList | undefined; connections: LandmarkConnectionArray }) {
  const { landmarks, connections } = props;

  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {landmarks &&
        connections.map((connection) => (
          <Line
            points={[landmarkToVector(landmarks[connection[0]]), landmarkToVector(landmarks[connection[1]])]}
            color={0x00ffff}
            lineWidth={3}
          />
        ))}
    </>
  );
}

function Guideline(props: { symbols: GuidelineSymbols }) {
  const { symbols } = props;

  return (
    <>
      {symbols.lines &&
        symbols.lines.map((line) => <Line points={[landmarkToVector(line.from), landmarkToVector(line.to)]} />)}
      {symbols.squares &&
        symbols.squares.map((square) => (
          <Plane position={square.position} scale={square.scale} rotation={square.rotation} />
        ))}
    </>
  );
}

function ResetCameraButton(props: { cameraAngle: CameraAngle }) {
  const { cameraAngle } = props;
  const { camera } = useThree();
  const setCameraPosition = () => {
    const { x, y, z } = calculateCameraPosition(cameraAngle);
    camera.position.set(x, y, z);
    camera.lookAt(new Vector3(0, 0, 0));
  };

  return (
    <Button
      onClick={() => {
        setCameraPosition();
      }}
      variant="contained"
      sx={{ position: 'absolute', top: 0, textAlign: 'center', zIndex: 2 }}
    >
      Reset Camera Position
    </Button>
  );
}

function PoseViewer(props: {
  landmarks: NormalizedLandmarkList | undefined;
  defaultCameraAngle?: CameraAngle;
  guidelineSymbols?: GuidelineSymbols;
}) {
  const { landmarks, defaultCameraAngle, guidelineSymbols } = props;

  return (
    <Suspense fallback={<span>loading...</span>}>
      <Canvas>
        <Camera />
        <GridStage />
        <Landmarks landmarks={landmarks} />
        <Bones landmarks={landmarks} connections={KINECT_POSE_CONNECTIONS} />
        <Guideline symbols={guidelineSymbols ?? {}} />
      </Canvas>
      <ResetCameraButton cameraAngle={defaultCameraAngle ?? { phi: 0, theta: 90 }} />
    </Suspense>
  );
}

// for avoiding ESLint error
PoseViewer.defaultProps = { defaultCameraAngle: { phi: 0, theta: 90 }, guidelineSymbols: {} };

export default PoseViewer;
