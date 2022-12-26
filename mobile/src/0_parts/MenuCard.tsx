import { Card, CardMedia, Typography } from '@mui/material';
import { WorkoutMenu } from '../utils/training';

interface MenuCardProps {
  workoutMenu: WorkoutMenu;
}

export default function MenuCard({ workoutMenu }: MenuCardProps) {
  return (
    <Card sx={{ p: 1, boxShadow: 'none', borderRadius: 3 }}>
      <CardMedia
        component="img"
        image={workoutMenu.imageUrl}
        sx={{ width: '160px', height: '160px', objectFit: 'contain' }}
      />
      <Typography fontWeight={600}>{workoutMenu.name}</Typography>
    </Card>
  );
}
