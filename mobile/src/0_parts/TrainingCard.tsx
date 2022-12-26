import { Card, CardMedia, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

interface TrainingCardProps {
  title: string;
  image: string;
}

export default function TrainingCard({ title, image }: TrainingCardProps) {
  return (
    <Card component={Link} to="/detail">
      <CardMedia component="img" image={image} sx={{ width: '300px', objectFit: 'fill' }} />
      <Typography>{title}</Typography>
    </Card>
  );
}
