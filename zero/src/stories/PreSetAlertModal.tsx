import { Modal, Paper, Typography } from '@mui/material';
import { Stack } from '@mui/system';

interface PreSetAlertModalProps {
  description: string;
  open: boolean;
  // eslint-disable-next-line react/require-default-props
  onClose?: () => void;
}

export default function PreSetAlertModal({ description, open, onClose }: PreSetAlertModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <Paper
        sx={{
          marginBlock: '35vh',
          height: '30vh',
          borderRadius: '0px',
          borderWidth: '0px',
          boxShadow: 'none',
          background: 'linear-gradient(to right, grey, orange, orange, orange, grey)',
        }}
      >
        <Stack direction="column" justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
          <Typography variant="h2" align="center" fontWeight="bold" color="white">
            {description}
          </Typography>
        </Stack>
      </Paper>
    </Modal>
  );
}
