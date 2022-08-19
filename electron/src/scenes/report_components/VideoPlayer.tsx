import { Paper } from '@mui/material';
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

  // TODO: ビデオの操作UXを快適にする（コントロールパネル、再生速度調整UIなど）
  return (
    <Paper>
      <ReactPlayer
        ref={videoRef}
        url={repVideoUrls[displayedRepIndex]}
        id="RepVideo"
        playing
        loop
        controls
        height="100%"
        width="100%"
        onReady={() => {
          if (poseGridRef.current) {
            // PoseGridをレップ映像に同期させる
            poseGridRef.current.startSynchronizingToVideo(videoRef, setRecord, displayedRepIndex);
          }
        }}
      />
    </Paper>
  );
}

export default VideoPlayer;
