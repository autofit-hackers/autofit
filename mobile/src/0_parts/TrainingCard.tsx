import { Card, CardMedia, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
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
        date: session.date,
      }}
    >
      <Stack spacing={0.5}>
        <Typography fontWeight={600}>{session.date}</Typography>
        <CardMedia
          component="img"
          image={session.thumbnailUrl}
          sx={{ width: '300px', objectFit: 'fill', borderRadius: 2 }}
        />
        <Stack direction="row" spacing={1}>
          {session.workoutNames.map((workoutName) => (
            <WorkoutNameChip key={workoutName} workoutName={workoutName} />
          ))}
        </Stack>
        <Typography fontWeight={600}>
          MAX: {session.maxWeight}kg 合計{session.reps}セット
        </Typography>
        {session.summaryComment && session.trainerId ? (
          <SummaryCommentCard comment={session.summaryComment} trainerId={session.trainerId} />
        ) : null}
      </Stack>
    </Card>
  );
}
