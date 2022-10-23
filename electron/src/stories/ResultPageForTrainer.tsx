import { Chip, Grid, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import ReactPlayer from 'react-player';
import FlatButton from './FlatButton';
import FlatCard from './FlatCard';
import Header from './Header';
import RadarChart from './RadarChart';
import ResultDetailModal from './ResultDetailModal';

interface ResultPageForTrainerProps {
  /**
   * Button contents
   */
  videoUrl: string;
  summaryDescription: string;
  handleBack: () => void;
  handleForward: () => void;
}

export default function ResultForTrainer({
  videoUrl,
  summaryDescription,
  handleBack,
  handleForward,
}: ResultPageForTrainerProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const radarChartItems = [
    {
      name: 'ひざの開き',
      value: 70,
    },
    {
      name: '背筋の張り',
      value: 40,
    },
    {
      name: '腰の張り',
      value: 50,
    },
    {
      name: '腕の開き',
      value: 90,
    },
    {
      name: '腕の張り',
      value: 80,
    },
    {
      name: '腕の上げ下げ',
      value: 30,
    },
  ];
  const onClick = {
    click(params: { name: string }) {
      setDescription(params.name);
      setOpen(true);
    },
  };

  return (
    <div>
      <Grid container sx={{ paddingBlock: '5vh', height: '90vh' }}>
        {/* ヘッダー */}
        <Header title="今回のトレーニング結果" />
        {/* 左側 */}
        <Grid item xs={6} sx={{ paddingBlock: '2.5vh', paddingInline: '5vw', height: '60vh' }}>
          <ReactPlayer
            url={videoUrl}
            id="RepVideo"
            playing
            loop
            muted
            // controls
            width="100%"
            height="100%"
            style={{
              border: '6px',
              borderRadius: '24px',
              borderColor: '#4AC0E3',
              // backgroundColor: 'rgba(0, 0, 0, 1.0)',
            }}
          />
        </Grid>
        {/* 右側 */}
        <Grid item xs={6} sx={{ paddingBlock: '2.5vh', paddingRight: '5vw' }}>
          <Stack direction="row" alignItems="center">
            <RadarChart
              radarChartItems={radarChartItems}
              onClick={onClick}
              style={{ width: '100%', height: '50vh' }}
            />
            {/* <Score value={80} /> */}
          </Stack>
          <FlatCard>
            <Stack spacing={2} alignItems="flex-start">
              <Chip
                label="総評"
                sx={{ fontSize: 16, fontWeight: 'bold', color: 'white', backgroundColor: '#4AC0E3', paddingInline: 1 }}
              />
              <Typography variant="h5" component="h1" fontWeight="bold">
                {summaryDescription}
              </Typography>
            </Stack>
          </FlatCard>
        </Grid>
        {/* フッター */}
        <Grid item xs={12} sx={{ paddingBlock: '2.5vh', paddingInline: '5vw' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing="50vw">
            <FlatButton label="戻る" onClick={handleBack} />
            <FlatButton label="終了" onClick={handleForward} />
          </Stack>
        </Grid>
      </Grid>
      {/* 詳細のモーダル */}
      <ResultDetailModal
        checkpointName={description}
        open={open}
        description={description}
        handleClose={() => setOpen(false)}
      />
    </div>
  );
}
