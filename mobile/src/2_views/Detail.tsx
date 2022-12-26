import { Button, CardMedia, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Detail() {
  return (
    <>
      <Typography>ハイライト動画</Typography>
      <CardMedia
        component="iframe"
        src="https://www.youtube.com/watch?v=Q8TXgCzxEnw"
        sx={{ width: '300px', objectFit: 'fill' }}
      />
      <Typography>トレーナーからのコメント</Typography>
      <Typography>HogeHoge</Typography>
      <Button component={Link} to="/">
        トレーニングに戻る
      </Button>
    </>
  );
}
