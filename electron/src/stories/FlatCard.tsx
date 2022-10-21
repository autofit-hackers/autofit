import { Box, SxProps, Theme } from '@mui/material';

interface FlatCardProps {
  /**
   * Button contents
   */
  children: React.ReactNode;

  // eslint-disable-next-line react/require-default-props
  onClick?: () => void;

  // eslint-disable-next-line react/require-default-props
  sx?: SxProps<Theme>;
}

export default function FlatCard({ children, onClick, sx }: FlatCardProps) {
  return (
    <Box onClick={onClick} sx={{ borderRadius: 5, p: 2, border: 6, borderColor: '#4AC0E3', width: '100%', ...sx }}>
      {children}
    </Box>
  );
}
