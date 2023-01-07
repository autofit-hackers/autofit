import { CardMedia, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useAtom } from 'jotai';
import { trainerAtom } from '../utils/atoms';

interface SummaryCommentCardProps {
  comment: string;
  trainerId: string;
}

export default function SummaryCommentCard({ comment, trainerId }: SummaryCommentCardProps) {
  const [trainers] = useAtom(trainerAtom);
  const trainer = trainers ? trainers.find((tr) => tr.id === trainerId) : null;

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ p: 1, alignItems: 'center', backgroundColor: 'rgb(240,240,240)', borderRadius: 2 }}
    >
      {trainer ? (
        <CardMedia
          component="img"
          image={trainer.imageUrl}
          sx={{ width: '60px', height: '60px', objectFit: 'fit', borderRadius: '30px' }}
        />
      ) : null}

      <Typography fontWeight={600}>{comment}</Typography>
    </Stack>
  );
}
