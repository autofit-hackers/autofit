import { CardMedia, ListItem, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { Session } from '../utils/training';

interface ByWorkoutListItemProps {
  itemId: number;
  session: Session;
}

export default function ByWorkoutListItem({ itemId, session }: ByWorkoutListItemProps) {
  return (
    <ListItem key={itemId} disablePadding>
      <Link to="/detail" style={{ width: '100%', textDecoration: 'none' }} state={{ date: session.date }}>
        <Stack direction="row" spacing={2} sx={{ p: 1, alignItems: 'center', width: '100%', borderRadius: 2 }}>
          <CardMedia
            component="img"
            src={session.thumbnailUrl}
            sx={{ width: '100px', height: '100px', objectFit: 'cover' }}
          />
          <Stack direction="column" spacing={0.5}>
            <Typography fontWeight={600}>{session.date}</Typography>
            <Typography fontWeight={600}>1RM換算: {session.maxWeight}kg</Typography>
            <Typography fontWeight={600}>{session.summaryComment}</Typography>
          </Stack>
        </Stack>
      </Link>
    </ListItem>
  );
}
