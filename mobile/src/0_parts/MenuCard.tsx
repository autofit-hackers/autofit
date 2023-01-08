import { Card, CardMedia, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { WorkoutMenu } from '../utils/training';

interface MenuCardProps {
  workoutMenu: WorkoutMenu;
}

export default function MenuCard({ workoutMenu }: MenuCardProps) {
  return (
    <Card
      sx={{ p: 1, boxShadow: 'none', borderRadius: 3, textDecoration: 'none' }}
      component={Link}
      to="/by-workout"
      state={{ workoutName: workoutMenu.name }}
    >
      <CardMedia
        component="img"
        image={workoutMenu.imageUrl}
        sx={{ width: '160px', height: '160px', objectFit: 'contain' }}
      />
      <Typography fontWeight={600}>{workoutMenu.name}</Typography>
    </Card>
  );
}
