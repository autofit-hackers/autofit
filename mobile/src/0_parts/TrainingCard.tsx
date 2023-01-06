import { Card, CardMedia, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { dummyComments } from '../utils/dummyData.ts/dummyComment';
import { dummySets } from '../utils/dummyData.ts/dummySet';
import { Session } from '../utils/training';
import SummaryCommentCard from './SummaryCommentCard';
import WorkoutNameChip from './WorkoutNameChip';

interface SessionCardProps {
  session: Session;
}

export default function SessionCard({ session }: SessionCardProps) {
  return (
    <Card
      sx={{ p: 2, boxShadow: 'none', borderRadius: 2, textDecoration: 'none' }}
      component={Link}
      to="/detail"
      state={{
        sets: dummySets.filter((set) => set.sessionId === session.id),
        comments: dummyComments,
      }}
    >
      <Stack spacing={0.5}>
        <CardMedia
          component="img"
          image={session.thumbnailUrl}
          sx={{ width: '300px', objectFit: 'fill', borderRadius: 2 }}
        />
        <Typography>{session.date}</Typography>
        <Stack direction="row" spacing={0.5}>
          {session.workoutNames.map((workoutName) => (
            <WorkoutNameChip key={workoutName} workoutName={workoutName} />
          ))}
        </Stack>
        <SummaryCommentCard />
      </Stack>
    </Card>
  );
}
