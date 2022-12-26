import { Box, Stack, Typography } from '@mui/material';
import SessionCard from '../0_parts/TrainingCard';
import { Session } from '../utils/training';

interface LatestTrainingListProps {
  sessions: Session[];
}

export default function LatestSessionList({ sessions }: LatestTrainingListProps) {
  return (
    <>
      <Typography sx={{ ml: 2, mt: 2, fontWeight: 700, fontSize: 'large' }}>直近のトレーニング</Typography>
      <Box sx={{ overflow: 'scroll' }}>
        <Stack direction="row" spacing={2} sx={{ width: `${sessions.length * 80 + 20}%`, m: 2 }}>
          {sessions.map((session) => (
            <SessionCard session={session} />
          ))}
        </Stack>
      </Box>
    </>
  );
}
