import { Box, CardMedia, Chip, Grid, Modal, Stack, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useState } from 'react';
import ReactPlayer from 'react-player';
import postureImage from '../../resources/images/formInstructionItems/knee-front-and-back.png';
import depthImage from '../../resources/images/formInstructionItems/squat-depth.png';
import speedImage from '../../resources/images/formInstructionItems/squat-velocity.png';
import { Checkpoint } from '../coaching/formEvaluation';
import { phaseAtom, setRecordAtom, SettingsAtom } from './atoms';
import ResultModal from './ResultModal';
import { FlatButton, FlatCard } from './ui-components/FlatUI';

function InstructionCardClickable({
  label,
  isGood,
  imageUrl,
  onClick,
}: {
  label: string;
  isGood: boolean;
  imageUrl: string;
  onClick: () => void;
}) {
  return (
    <Box sx={{ borderRadius: 5, p: 3, borderWidth: 6, borderColor: '#4AC0E3', width: '100%' }} onClick={onClick}>
      <Stack spacing={2}>
        <Chip
          label={label}
          sx={{ fontWeight: 'bold', color: 'white', backgroundColor: '#4AC0E3', paddingInline: 1 }}
        />
        <CardMedia component="img" image={imageUrl} alt="image" style={{ objectFit: 'contain' }} />
        <Typography variant="h5" component="h1" fontWeight="bold">
          {isGood ? 'Good' : 'Bad'}
        </Typography>
        <Typography>タップして詳細を見る</Typography>
      </Stack>
    </Box>
  );
}

export default function Report2() {
  const [, setPhase] = useAtom(phaseAtom);
  const [setRecord] = useAtom(setRecordAtom);
  const [settings] = useAtom(SettingsAtom);

  const [open, setOpen] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(settings.checkpoints[0]);

  const handleOpen = (checkpoint: Checkpoint) => {
    setOpen(true);
    setSelectedCheckpoint(checkpoint);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Grid container sx={{ paddingBlock: '5vh', paddingInline: '0vw' }}>
        {/* ヘッダー */}
        <Grid item xs={12} sx={{ paddingBlock: '2.5vh', paddingInline: '5vw' }}>
          <Typography variant="h5" component="h1" align="left" borderBottom={1} fontWeight="bold">
            今回のトレーニング結果
          </Typography>
        </Grid>
        {/* 左側 */}
        <Grid item xs={6} sx={{ paddingBlock: '2.5vh', paddingInline: '5vw' }}>
          <ReactPlayer
            url={setRecord.repVideoUrls.slice(-1)[0]}
            id="RepVideo"
            playing
            loop
            // controls
            width="100%"
            height="100%"
            style={{
              borderRadius: '24px',
              borderColor: '#4AC0E3',
              borderWidth: '6px',
              backgroundColor: 'rgba(0, 0, 0, 1.0)',
            }}
          />
        </Grid>
        {/* 右側 */}
        <Grid item xs={6} sx={{ paddingBlock: '2.5vh', paddingRight: '5vw' }}>
          <FlatCard>
            <Stack spacing={2} alignItems="flex-start">
              <Chip
                label="ポイント"
                sx={{ fontWeight: 'bold', color: 'white', backgroundColor: '#4AC0E3', paddingInline: 1 }}
              />
              <Typography variant="h5" component="h1" fontWeight="bold">
                {setRecord.resultSummary.description}
              </Typography>
            </Stack>
          </FlatCard>
          {/* 各評価項目のカード */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mt: '5vh' }}>
            <InstructionCardClickable
              label="深さ"
              isGood={setRecord.checkpointResults[0].isGood}
              imageUrl={depthImage}
              onClick={() => handleOpen(settings.checkpoints[0])}
            />
            <InstructionCardClickable
              label="速度"
              isGood={setRecord.checkpointResults[1].isGood}
              imageUrl={speedImage}
              onClick={() => handleOpen(settings.checkpoints[1])}
            />
            <InstructionCardClickable
              label="姿勢"
              isGood={setRecord.checkpointResults[2].isGood}
              imageUrl={postureImage}
              onClick={() => handleOpen(settings.checkpoints[2])}
            />
          </Stack>
        </Grid>
        {/* フッター */}
        <Grid item xs={12} sx={{ paddingBlock: '2.5vh', paddingInline: '5vw' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing="50vw">
            <FlatButton text="戻る" onClick={() => setPhase((prev) => prev - 1)} />
            <FlatButton text="次へ" onClick={() => setPhase((prev) => prev + 1)} />
          </Stack>
        </Grid>
      </Grid>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <ResultModal
          handleClose={handleClose}
          checkpoint={selectedCheckpoint}
          checkResult={setRecord.checkpointResults[selectedCheckpoint.id]}
          worstRep={setRecord.reps[setRecord.checkpointResults[selectedCheckpoint.id].worstRepIndex]}
        />
      </Modal>
    </div>
  );
}
