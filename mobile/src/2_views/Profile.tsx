import { CardMedia, Stack } from '@mui/material';
import { Link } from 'react-router-dom';
import AlertDialog from '../0_parts/AlertDialog';

export default function Profile() {
  return (
    <Stack alignItems="center">
      <CardMedia
        component="img"
        image="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80"
        sx={{ width: '100px', objectFit: 'cover', height: '100px', borderRadius: '50%' }}
      />
      <AlertDialog />
      <Link to="/">ホームに戻る</Link>
    </Stack>
  );
}
