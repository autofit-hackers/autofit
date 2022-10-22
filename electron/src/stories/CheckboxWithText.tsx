import { CardMedia, Theme, Typography } from '@mui/material';
import { Stack, SxProps } from '@mui/system';
import filledCheckbox from '../../resources/images/checkbox-filled.svg';
import emptyCheckbox from '../../resources/images/checkbox-unfilled.svg';

interface CheckboxWithTextProps {
  /**
   * Button contents
   */
  text: string;

  isChecked: boolean;

  // eslint-disable-next-line react/require-default-props
  checkboxSx?: SxProps<Theme>;

  // eslint-disable-next-line react/require-default-props
  textSx?: SxProps<Theme>;
}

export default function CheckboxWithText({ text, isChecked, checkboxSx, textSx }: CheckboxWithTextProps) {
  const checkboxSrc = isChecked ? filledCheckbox : emptyCheckbox;

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <CardMedia component="img" image={checkboxSrc} sx={{ width: '50px', objectFit: 'fill', ...checkboxSx }} />
      <Typography
        sx={{
          fontFamily: 'Roboto',
          fontSize: '200%',
          fontWeight: '600',
          lineHeight: '100px',
          letterSpacing: '0.5px',
          TextAlign: 'left',
          ...textSx,
        }}
      >
        {text}
      </Typography>
    </Stack>
  );
}
