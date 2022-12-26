import { Card, CardMedia, Typography } from '@mui/material';

interface MenuCardProps {
  title: string;
  image: string;
}

export default function MenuCard({ title, image }: MenuCardProps) {
  return (
    <Card>
      <CardMedia component="img" image={image} sx={{ width: '200px', height: '200px', objectFit: 'fill' }} />
      <Typography>{title}</Typography>
    </Card>
  );
}
