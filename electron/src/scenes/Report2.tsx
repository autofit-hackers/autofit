import { Box, Button, Chip, Grid, Stack, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useRef } from 'react';
import ReactPlayer from 'react-player';
// eslint-disable-next-line import/no-unresolved
import BaseReactPlayer, { BaseReactPlayerProps } from 'react-player/base';
import { phaseAtom } from './atoms';

function FlatCard({ children }: { children: React.ReactNode }) {
  return <Box sx={{ borderRadius: 5, p: 3, borderWidth: 6, borderColor: '#4AC0E3' }}>{children}</Box>;
}

function FlatButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      sx={{
        borderRadius: 20,
        p: 2,
        borderWidth: 6,
        borderColor: '#4AC0E3',
        width: '100%',
        height: '100%',
        fontSize: 'h5.fontSize',
        fontWeight: 'bold',
        paddingLeft: '70px',
        paddingRight: '70px',
        '&:hover': {
          backgroundColor: '#4AC0E3',
          color: 'white',
        },
      }}
    >
      {text}
    </Button>
  );
}

export default function Report2() {
  const [, setPhase] = useAtom(phaseAtom);
  const videoPlayerRef = useRef<BaseReactPlayer<BaseReactPlayerProps>>(null);

  return (
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
              全体的なフォームはきれいですが、 体幹に力を入れて胴体をまっすぐに保つように。 歌声にもあらわれています。
            </Typography>
          </Stack>
        </FlatCard>
        {/* 各評価項目のカード */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mt: '5vh' }}>
          <FlatCard>
            <Stack spacing={2}>
              <Chip
                label="深さ"
                sx={{ fontWeight: 'bold', color: 'white', backgroundColor: '#4AC0E3', paddingInline: 1 }}
              />
              <Typography variant="h5" component="h1" fontWeight="bold">
                Good
              </Typography>
            </Stack>
          </FlatCard>
          <FlatCard>
            <Stack spacing={2}>
              <Chip
                label="深さ"
                sx={{ fontWeight: 'bold', color: 'white', backgroundColor: '#4AC0E3', paddingInline: 1 }}
              />
              <Typography variant="h5" component="h1" fontWeight="bold">
                Good
              </Typography>
            </Stack>
          </FlatCard>
          <FlatCard>
            <Stack spacing={2}>
              <Chip
                label="深さ"
                sx={{ fontWeight: 'bold', color: 'white', backgroundColor: '#4AC0E3', paddingInline: 1 }}
              />
              <Typography variant="h5" component="h1" fontWeight="bold">
                Good
              </Typography>
            </Stack>
          </FlatCard>
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
  );
}
