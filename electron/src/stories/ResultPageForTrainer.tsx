import { CardMedia, Chip, Grid, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { Checkpoint, CheckResult } from '../coaching/formEvaluation';
import FlatButton from './FlatButton';
import FlatCard from './FlatCard';
import Header from './Header';
import RadarChart from './RadarChart';
import ResultDetailModal from './ResultDetailModal';

interface ResultPageForTrainerProps {
  /**
   * Page contents
   */
  videoUrl: string;
  summaryDescription: string;
  results: CheckResult[];
  checkpoints: Checkpoint[];
  handleBack: () => void;
  handleForward: () => void;
}

export default function ResultForTrainer({
  videoUrl,
  summaryDescription,
  results,
  checkpoints,
  handleBack,
  handleForward,
}: ResultPageForTrainerProps) {
  const [open, setOpen] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState('');

  // レーダーチャートの項目を作成
  const radarChartItems = checkpoints.map((checkpoint) => ({
    name: checkpoint.nameJP,
    value: results.find((r) => r.nameEN === checkpoint.nameEN)?.scoreForSet || 0,
  }));

  // レーダーチャートの各項目をクリックしたときの処理
  const onClick = {
    click(params: { name: string }) {
      setSelectedCheckpoint(params.name);
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
          <CardMedia
            component="video"
            image={videoUrl}
            style={{ height: '100%', objectFit: 'contain' }}
            autoPlay
            loop
            muted
            sx={{
              border: 6,
              borderRadius: 5,
              borderColor: '#4AC0E3',
              backgroundColor: 'rgba(0, 0, 0, 1.0)',
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
        checkpointName={selectedCheckpoint}
        open={open}
        description={results.find((r) => r.nameJP === selectedCheckpoint)?.description || ''}
        leftVideoUrl={checkpoints.find((r) => r.nameJP === selectedCheckpoint)?.lectureVideoUrl || ''}
        rightVideoUrl="../../../resources/movie/squat-depth.mov"
        handleClose={() => setOpen(false)}
      />
    </div>
  );
}
