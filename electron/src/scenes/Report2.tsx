import { Button } from '@mui/material';
import { useAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
// eslint-disable-next-line import/no-unresolved
import BaseReactPlayer, { BaseReactPlayerProps } from 'react-player/base';
import result2 from '../../resources/images/result/result2.png';
import { PoseGrid } from '../utils/poseGrid';
import { formInstructionItemsAtom, phaseAtom } from './atoms';

export default function Report2() {
  const [, setPhase] = useAtom(phaseAtom);
  const poseGridRef = useRef<PoseGrid | null>(null);
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);
  const videoPlayerRef = useRef<BaseReactPlayer<BaseReactPlayerProps>>(null);

  // Reportコンポーネントマウント時にKinectを停止し、PoseGridを作成する
  useEffect(() => {
    if (!poseGridRef.current && gridDivRef.current !== null) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      poseGridRef.current = new PoseGrid(gridDivRef.current);
      poseGridRef.current.setCameraAngle(formInstructionItems[0].poseGridCameraAngle);
    }
  }, [formInstructionItems]);

  return (
    <>
      <img src={result2} alt="Result2" style={{ height: '100vh' }} />
      <ReactPlayer
        ref={videoPlayerRef}
        url="../../resources/images/result/sq-video.mov"
        id="RepVideo"
        playing
        loop
        controls
        width="420px"
        height="500px"
        style={{
          zIndex: 2,
          position: 'absolute',
          width: '420px',
          height: '500px',
          top: '190px',
          left: '40px',
          borderRadius: '20px',
          borderColor: '#4AC0E3',
          borderWidth: '8px',
          backgroundColor: 'rgba(0, 0, 0, 1.0)',
        }}
      />

      <Button
        sx={{
          position: 'absolute',
          top: '770px',
          left: '1000px',
          transform: 'translate(-50%, -50%)',
          height: '60px',
          width: '225x',
          borderRadius: '40px',
          backgroundColor: '#4AC0E3',
          color: '#FFFFFF',
          fontSize: '24px',
          fontWeight: 'bold',
          paddingLeft: '70px',
          paddingRight: '70px',
        }}
        onClick={() => {
          setPhase(0);
        }}
      >
        終了
      </Button>
    </>
  );
}
