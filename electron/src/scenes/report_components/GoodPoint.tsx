import { Grid, Paper, Typography } from '@mui/material';

function GoodPoint(props: { text: string }) {
  const { text } = props;

  return (
    <Grid item xs={12}>
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '5vh',
          backgroundColor: '#005555',
          border: 1,
          borderColor: 'grey.500',
          borderRadius: 5,
          boxShadow: 0,
          color: '#00ffff',
        }}
      >
        <Typography variant="h5">{text}</Typography>
      </Paper>
    </Grid>
  );
}

export default GoodPoint;
