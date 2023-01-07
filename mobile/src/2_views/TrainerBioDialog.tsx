import CloseIcon from '@mui/icons-material/Close';
import { Box, CardMedia, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { trainerAtom } from '../utils/atoms';

interface TrainerBioDialogProps {
  trainerId: string;
  open: boolean;
  onClose: () => void;
}

export default function TrainerBioDialog({ trainerId, open, onClose }: TrainerBioDialogProps) {
  const [trainers] = useAtom(trainerAtom);
  const trainer = trainers ? trainers.find((tr) => tr.id === trainerId) : null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Box flexGrow={1}>トレーナー紹介</Box>
          <Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {trainer ? (
          <Stack direction="column" spacing={2}>
            <CardMedia
              component="img"
              image={trainer.imageUrl}
              sx={{ width: '100%', objectFit: 'fit', borderRadius: '25px' }}
            />
            <Typography fontWeight={600}>{trainer.name} トレーナー</Typography>
            <Typography>{trainer.bio}</Typography>
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
