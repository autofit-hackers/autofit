import { Paper, Typography } from '@mui/material';

function ResultDescription(props: {
  descriptionsForEachRep: string[];
  isOverallComment: boolean;
  overallComments: string[];
}) {
  // TODO: bool とコメントを両方持つのはダサいので総評と指導項目ごとコメントは分けてもいいかも
  const { descriptionsForEachRep, isOverallComment, overallComments } = props;
  // overallComments.map((comment, idx) => <Typography key={idx}>{comment}</Typography>)

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#005555',
        border: 1,
        height: '100%',
        width: '100%',
        borderColor: 'grey.500',
        borderRadius: 5,
        boxShadow: 0,
        color: '#00ffff',
      }}
    >
      {isOverallComment
        ? overallComments.map((comment, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <Typography key={idx}>{comment}</Typography>
          ))
        : descriptionsForEachRep.map((description, repIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <Typography key={repIndex}>
              {repIndex + 1}レップ目では、{description}
            </Typography>
          ))}
      {}
    </Paper>
  );
}

export default ResultDescription;
