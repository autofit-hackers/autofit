import { Grid, Typography } from '@mui/material';

export default function Header({ title }: { title: string }) {
  return (
    <Grid item xs={12} sx={{ paddingBlock: '2.5vh', paddingInline: '5vw' }}>
      <Typography variant="h5" component="h1" align="left" borderBottom={1} fontWeight="bold">
        {title}
      </Typography>
    </Grid>
  );
}
