import { Box, Stack, Typography } from '@mui/material';
import TrainingCard from '../0_parts/TrainingCard';

interface LatestTrainingListProps {
  trainings: {
    title: string;
    image: string;
  }[];
}

export default function LatestTrainingList({ trainings }: LatestTrainingListProps) {
  return (
    <>
      <Typography sx={{ ml: 2, mt: 2, fontWeight: 700, fontSize: 'large' }}>直近のトレーニング</Typography>
      <Box sx={{ overflow: 'scroll' }}>
        <Stack direction="row" spacing={2} sx={{ width: `${trainings.length * 80 + 20}%`, m: 2 }}>
          {trainings.map((training) => (
            <TrainingCard title={training.title} image={training.image} />
          ))}
        </Stack>
      </Box>
    </>
  );
}
