import { List } from '@mui/material';
import ByWorkoutListItem from '../0_parts/ByWorkoutListItem';
import { Session } from '../utils/training';

interface ByWorkoutListProps {
  sessions: Session[];
}

export default function ByWorkoutList({ sessions }: ByWorkoutListProps) {
  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {sessions.map((session, index) => (
        <ByWorkoutListItem itemId={index} session={session} />
      ))}
    </List>
  );
}
