import { Chip } from '@mui/material';

interface WorkoutNameChipProps {
  workoutName: string;
}

export default function WorkoutNameChip({ workoutName }: WorkoutNameChipProps) {
  return (
    <Chip
      label={workoutName}
      sx={{
        backgroundColor: 'rgb(200,250,250)',
        color: 'rgb(100,100,100)',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        height: '1.5rem',
        lineHeight: '1.5rem',
      }}
    />
  );
}
