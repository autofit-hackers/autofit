import { Card, CardMedia, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { dummyComments } from '../utils/dummyData.ts/dummyComment';
import { dummySets } from '../utils/dummyData.ts/dummySet';
import { getOneRepMaxFromSets, Session } from '../utils/training';
import SummaryCommentCard from './SummaryCommentCard';
import WorkoutNameChip from './WorkoutNameChip';

interface SessionCardProps {
  session: Session;
}

export default function SessionCard({ session }: SessionCardProps) {
  const correspondingSets = dummySets.filter((set) => set.sessionId === session.id);
  const oneRepMax = getOneRepMaxFromSets(correspondingSets);

  return (
    <Card
      sx={{ p: 2, boxShadow: 'none', borderRadius: 2, textDecoration: 'none' }}
      component={Link}
      to="/detail"
      state={{
        sets: correspondingSets,
        comments: dummyComments,
        date: session.date,
      }}
    >
      <Stack spacing={0.5}>
        <CardMedia
          component="img"
          image={session.thumbnailUrl}
          sx={{ width: '300px', objectFit: 'fill', borderRadius: 2 }}
        />
        <Typography fontWeight={600}>{session.date}</Typography>
        <Stack direction="row" spacing={1}>
          {session.workoutNames.map((workoutName) => (
            <WorkoutNameChip key={workoutName} workoutName={workoutName} />
          ))}
        </Stack>
        <Typography fontWeight={600}>
          MAX: {oneRepMax.toFixed(1)}kg 合計{correspondingSets.length}セット
        </Typography>
        <SummaryCommentCard />
      </Stack>
    </Card>
  );
}
