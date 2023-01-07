import { CardMedia, Stack, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useState } from 'react';
import TrainerBioDialog from '../2_views/TrainerBioDialog';
import { trainerAtom } from '../utils/atoms';

interface TrainerBioCardProps {
  trainerId: string;
}

export default function TrainerBioCard({ trainerId }: TrainerBioCardProps) {
  const [trainers] = useAtom(trainerAtom);
  const trainer = trainers ? trainers.find((tr) => tr.id === trainerId) : null;

  const [open, setOpen] = useState(false);

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        sx={{ p: 2, alignItems: 'center', backgroundColor: 'rgb(240,240,240)', borderRadius: 2 }}
        onClick={() => setOpen(true)}
      >
        {trainer ? (
          <>
            <CardMedia
              component="img"
              image={trainer.imageUrl}
              sx={{ width: '50px', height: '50px', objectFit: 'fit', borderRadius: '25px' }}
            />
            <Stack direction="column">
              <Typography fontSize="small" fontWeight={600}>
                {trainer.name} トレーナー
              </Typography>
              <Typography fontSize="small" fontWeight={600}>
                {trainer.bio}
              </Typography>
            </Stack>
          </>
        ) : null}
      </Stack>
      <TrainerBioDialog trainerId={trainerId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
