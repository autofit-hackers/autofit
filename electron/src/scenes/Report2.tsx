import { Button } from '@mui/material';
import { Box } from '@mui/system';
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
    <Box display="flex" justifyContent="center">
      <img src={result2} alt="Result2" style={{ height: '100vh' }} />
      <ReactPlayer
        ref={videoPlayerRef}
        url="../../resources/images/result/sq-video.mov"
        id="RepVideo"
        playing
        loop
        controls
        width="30vw"
        height="31.2vw"
        style={{
          zIndex: 2,
          position: 'absolute',
          width: '420px',
          height: '500px',
          top: '22vh',
          left: '12.5vw',
          borderRadius: '24px',
          borderColor: '#4AC0E3',
          borderWidth: '6px',
          backgroundColor: 'rgba(0, 0, 0, 1.0)',
        }}
      />

      <Button
        sx={{
          position: 'absolute',
          top: '89vh',
          left: '76vw',
          transform: 'translate(-50%, -50%)',
          height: '60px', // 60
          width: '225px', // 225
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
    </Box>
  );
}
