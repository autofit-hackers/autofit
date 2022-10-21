import { Button, SxProps, Theme } from '@mui/material';

interface FlatButtonProps {
  /**
   * Button contents
   */
  label: string;

  onClick: () => void;

  // eslint-disable-next-line react/require-default-props
  sx?: SxProps<Theme>;
}

/**
 * Primary UI component for user interaction
 */
export default function FlatButton({ label, onClick, sx }: FlatButtonProps) {
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
        ...sx,
      }}
    >
      {label}
    </Button>
  );
}
