import { Chip } from '@mui/material';

interface WorkoutNameChipProps {
  workoutName: string;
}

export default function WorkoutNameChip({ workoutName }: WorkoutNameChipProps) {
  return (
    <Chip
      label={workoutName}
      sx={{
        backgroundColor: 'rgb(240,240,240)',
        color: 'rgb(100,100,100)',
        borderRadius: 2,
        fontSize: '0.8rem',
        fontWeight: 'bold',
        height: '1.5rem',
        lineHeight: '1.5rem',
        padding: '0 0.5rem',
        margin: '0 0.2rem',
      }}
    />
  );
}
