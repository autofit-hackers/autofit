import { Grid, Paper } from '@mui/material';
import { useAtom } from 'jotai';
import { useRef } from 'react';
import ReactPlayer from 'react-player';
// eslint-disable-next-line import/no-unresolved
import BaseReactPlayer, { BaseReactPlayerProps } from 'react-player/base';
import { PoseGrid } from '../../utils/poseGrid';
import { repVideoUrlsAtom, setRecordAtom } from '../atoms';

function VideoPlayer(props: { displayedRepIndex: number; poseGridRef: React.MutableRefObject<PoseGrid | null> }) {
  const videoRef = useRef<BaseReactPlayer<BaseReactPlayerProps>>(null);
  const { displayedRepIndex, poseGridRef } = props;
  const [repVideoUrls] = useAtom(repVideoUrlsAtom);
  const [setRecord] = useAtom(setRecordAtom);

  return (
    <Grid item xs={12}>
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '57vw',
          justifyContent: 'center',
        }}
      >
        <ReactPlayer
          ref={videoRef}
          url={repVideoUrls[displayedRepIndex]}
          id="RepVideo"
          playing
          loop
          controls
          width="100%"
          height="100%"
          onReady={() => {
            if (poseGridRef.current) {
              // PoseGridをレップ映像に同期させる
              poseGridRef.current.startSynchronizingToVideo(videoRef, setRecord, displayedRepIndex);
            }
          }}
        />
      </Paper>
    </Grid>
  );
}

export default VideoPlayer;
