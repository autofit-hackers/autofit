import { Box, Button } from '@mui/material';

export function FlatCard({ children }: { children: React.ReactNode }) {
  return <Box sx={{ borderRadius: 5, p: 2, borderWidth: 6, borderColor: '#4AC0E3', width: '100%' }}>{children}</Box>;
}

export function FlatCardClickable({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Box sx={{ borderRadius: 5, p: 3, borderWidth: 6, borderColor: '#4AC0E3', width: '100%' }} onClick={onClick}>
      {children}
    </Box>
  );
}

export function FlatButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      sx={{
        borderRadius: 20,
        p: 2,
        borderWidth: 6,
        borderColor: '#4AC0E3',
        fontSize: 'h5.fontSize',
        fontWeight: 'bold',
        paddingLeft: '70px',
        paddingRight: '70px',
        '&:hover': {
          backgroundColor: '#4AC0E3',
          color: 'white',
        },
      }}
    >
      {text}
    </Button>
  );
}
