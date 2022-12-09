import { Stack, Typography } from '@mui/material';
import { ReactElement } from 'react';

interface TextWithIconProps {
  icon: ReactElement;
  text: string;
}

export default function TextWithIcon({ icon, text }: TextWithIconProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="left">
      {icon}
      <Typography variant="h4" component="h1" align="left" sx={{ mx: '5vw' }} fontWeight="bold">
        {text}
      </Typography>
    </Stack>
  );
}
