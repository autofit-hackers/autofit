import { Paper, Typography } from '@mui/material';

function ResultDescription(props: {
  descriptionsForEachRep: string[];
  isOverallComment: boolean;
  summaryDescription: string[];
}) {
  // TODO: bool とコメントを両方持つのはダサいので総評と指導項目ごとコメントは別コンポーネントに分けてもいい
  const { descriptionsForEachRep, isOverallComment, summaryDescription } = props;

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        height: '100%',
        width: '100%',
        borderColor: 'grey.500',
        borderRadius: 5,
        boxShadow: 0,
      }}
    >
      {isOverallComment
        ? summaryDescription.map((description, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <Typography key={idx}>{description}</Typography>
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
