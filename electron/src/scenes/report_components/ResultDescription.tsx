import { Paper, Typography } from '@mui/material';

function ResultDescription(props: { descriptionsForEachRep: string[] }) {
  const { descriptionsForEachRep } = props;

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '20vh',
        backgroundColor: '#005555',
        border: 1,
        borderColor: 'grey.500',
        borderRadius: 5,
        boxShadow: 0,
        color: '#00ffff',
      }}
    >
      {descriptionsForEachRep.map((description, repIndex) => (
        // eslint-disable-next-line react/no-array-index-key
        <Typography key={repIndex}>
          {repIndex + 1}レップ目では、{description}
        </Typography>
      ))}
    </Paper>
  );
}

export default ResultDescription;
