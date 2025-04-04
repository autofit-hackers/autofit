import { Box, CardMedia, Chip, Grid, Modal, Stack, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useState } from 'react';
import ReactPlayer from 'react-player';
import postureImage from '../../resources/images/formInstructionItems/knee-front-and-back.png';
import depthImage from '../../resources/images/formInstructionItems/squat-depth.png';
import speedImage from '../../resources/images/formInstructionItems/squat-velocity.png';
import { Checkpoint } from '../coaching/formEvaluation';
import FlatButton from '../stories/FlatButton';
import FlatCard from '../stories/FlatCard';
import { resetSet, revokeVideoUrls } from '../training_data/set';
import { phaseAtom, setRecordAtom, settingsAtom } from './atoms';
import saveExercise from './handlers/save-exercise';
import ResultModal from './ResultModal';

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
    <Box sx={{ borderRadius: 5, p: 2, borderWidth: 6, borderColor: '#4AC0E3', width: '100%' }} onClick={onClick}>
      <Stack spacing={0}>
        <Chip
          label={label}
          sx={{ fontSize: 16, fontWeight: 'bold', color: 'white', backgroundColor: '#4AC0E3', paddingInline: 1 }}
        />
        <CardMedia component="img" image={imageUrl} alt="image" style={{ objectFit: 'contain' }} />
        <Typography variant="h5" component="h1" fontWeight="bold" color={isGood ? 'green' : 'red'}>
          {isGood ? 'Good' : 'Bad'}
        </Typography>
        <Typography>詳細を見る</Typography>
      </Stack>
    </Box>
  );
}

export function HeaderGridItem() {
  return (
    <Grid item xs={12} sx={{ paddingBlock: '2.5vh', paddingInline: '5vw' }}>
      <Typography variant="h5" component="h1" align="left" borderBottom={1} fontWeight="bold">
        今回のトレーニング結果
      </Typography>
    </Grid>
  );
}

export default function Report2() {
  const [, setPhase] = useAtom(phaseAtom);
  const [setRecord, setSetRecord] = useAtom(setRecordAtom);
  const [settings] = useAtom(settingsAtom);

  const [open, setOpen] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(settings.checkpoints[0]);

  const handleOpen = (checkpoint: Checkpoint) => {
    setOpen(true);
    setSelectedCheckpoint(checkpoint);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFinish = () => {
    saveExercise(setRecord);
    // TODO:データの保存をawaitする
    setTimeout(() => {
      revokeVideoUrls(setRecord);
      setSetRecord(resetSet());
      setPhase(0);
    }, 1000);
  };

  return (
    <div>
      <Grid container sx={{ paddingBlock: '5vh', height: '90vh' }}>
        {/* ヘッダー */}
        <HeaderGridItem />
        {/* 左側 */}
        <Grid item xs={6} sx={{ paddingBlock: '2.5vh', paddingInline: '5vw' }}>
          <ReactPlayer
            url={setRecord.frontVideoUrl}
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
                sx={{ fontSize: 16, fontWeight: 'bold', color: 'white', backgroundColor: '#4AC0E3', paddingInline: 1 }}
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
              isGood={setRecord.checkResult[0].isGood}
              imageUrl={depthImage}
              onClick={() => handleOpen(settings.checkpoints[0])}
            />
            <InstructionCardClickable
              label="速度"
              isGood={setRecord.checkResult[1].isGood}
              imageUrl={speedImage}
              onClick={() => handleOpen(settings.checkpoints[1])}
            />
            <InstructionCardClickable
              label="姿勢"
              isGood={setRecord.checkResult[2].isGood}
              imageUrl={postureImage}
              onClick={() => handleOpen(settings.checkpoints[2])}
            />
          </Stack>
        </Grid>
        {/* フッター */}
        <Grid item xs={12} sx={{ paddingBlock: '2.5vh', paddingInline: '5vw' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing="50vw">
            <FlatButton label="戻る" onClick={() => setPhase((prev) => prev - 1)} />
            <FlatButton label="終了" onClick={() => handleFinish()} />
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
          checkResult={setRecord.checkResult[selectedCheckpoint.id]}
          setRecord={setRecord}
        />
      </Modal>
    </div>
  );
}
