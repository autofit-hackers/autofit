import { Box, Paper, Slider } from '@mui/material';
import { useAtom } from 'jotai';
import { useRef, useState } from 'react';
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

  // 再生速度を調整
  const defaultPlaybackRate = 1;
  const [playbackRate, setPlaybackRate] = useState(defaultPlaybackRate);
  const handlePlaybackRateChange = (event: Event, newValue: number | number[]) => {
    setPlaybackRate(newValue as number);
  };
  const valuetext = (value: number) => `x${value}`;
  const marks = [
    {
      value: 0.2,
      label: 'x0.2',
    },
    {
      value: 0.4,
      label: 'x0.4',
    },
    {
      value: 0.6,
      label: 'x0.6',
    },
    {
      value: 0.8,
      label: 'x0.8',
    },
    {
      value: 1.0,
      label: 'x1.0',
    },
  ];

  return (
    <Paper sx={{ position: 'relative', height: '95%' }}>
      <Box sx={{ zIndex: 1 }}>
        <ReactPlayer
          ref={videoRef}
          url={repVideoUrls[displayedRepIndex]}
          id="RepVideo"
          playing
          loop
          playbackRate={playbackRate}
          height="100%"
          width="100%"
          onReady={() => {
            if (poseGridRef.current) {
              // PoseGridをレップ映像に同期させる
              poseGridRef.current.startSynchronizingToVideo(videoRef, setRecord, displayedRepIndex);
            }
          }}
        />
      </Box>
      <Slider
        aria-label="Playback Rate"
        defaultValue={defaultPlaybackRate}
        getAriaValueText={valuetext}
        valueLabelDisplay="auto"
        onChange={handlePlaybackRateChange}
        step={0.2}
        marks={marks}
        min={0.2}
        max={1.0}
        sx={{ zIndex: 2, position: 'absolute', bottom: 0, right: 0 }}
      />
    </Paper>
  );
}

export default VideoPlayer;
