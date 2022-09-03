import { Box } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { GoodChip } from './InstructionSummaryCards';

export default function InstructionItemExpression(props: {
  title: string;
  image: string;
  imagePosition: 'left' | 'right';
  isGood: boolean;
  fixedDescription: string;
  resultDescription: string;
}) {
  const { title, image, imagePosition, isGood, fixedDescription, resultDescription } = props;

  return (
    <Card sx={{ display: 'flex' }}>
      {imagePosition === 'left' ? <CardMedia component="img" height="100%" image={image} alt={title} /> : null}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <CardContent>
          <GoodChip isGood={isGood} />
          <Typography gutterBottom variant="h5" component="div">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {fixedDescription}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {resultDescription}
          </Typography>
        </CardContent>
      </Box>
      {imagePosition === 'right' ? <CardMedia component="img" height="100%" image={image} alt={title} /> : null}
    </Card>
  );
}
