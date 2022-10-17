import { Box, Chip, Grid, Modal, Stack, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
// eslint-disable-next-line import/no-unresolved
import BaseReactPlayer, { BaseReactPlayerProps } from 'react-player/base';
import { phaseAtom } from './atoms';
import ResultModal from './ResultModal';
import { FlatButton, FlatCard } from './ui-components/FlatUI';

function InstructionCardClickable({
  label,
  evaluationScore,
  onClick,
}: {
  label: string;
  evaluationScore: number;
  onClick: () => void;
}) {
  return (
    <Box sx={{ borderRadius: 5, p: 3, borderWidth: 6, borderColor: '#4AC0E3', width: '100%' }} onClick={onClick}>
      <Stack spacing={2}>
        <Chip
          label={label}
          sx={{ fontWeight: 'bold', color: 'white', backgroundColor: '#4AC0E3', paddingInline: 1 }}
        />
        <Typography variant="h5" component="h1" fontWeight="bold">
          {evaluationScore > 60 ? 'Good' : 'Bad'}
        </Typography>
      </Stack>
    </Box>
  );
}

export default function Report2() {
  const [, setPhase] = useAtom(phaseAtom);
  const videoPlayerRef = useRef<BaseReactPlayer<BaseReactPlayerProps>>(null);

  const [open, setOpen] = useState(false);
  const [instructionName, setInstructionName] = useState<'depth' | 'speed' | 'posture'>('depth');

  const handleOpen = (name: 'depth' | 'speed' | 'posture') => {
    setOpen(true);
    setInstructionName(name);
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
            ref={videoPlayerRef}
            url="../../resources/images/result/sq-video.mov"
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
                全体的なフォームはきれいですが、 体幹に力を入れて胴体をまっすぐに保つように。
                歌声にもあらわれています。
              </Typography>
            </Stack>
          </FlatCard>
          {/* 各評価項目のカード */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mt: '5vh' }}>
            <InstructionCardClickable label="深さ" evaluationScore={80} onClick={() => handleOpen('depth')} />
            <InstructionCardClickable label="速度" evaluationScore={20} onClick={() => handleOpen('speed')} />
            <InstructionCardClickable label="姿勢" evaluationScore={80} onClick={() => handleOpen('posture')} />
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
        <ResultModal handleClose={handleClose} instructionName={instructionName} />
      </Modal>
    </div>
  );
}
