import { Box, Stack } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { GoodChip } from './InstructionSummaryCards';

export const takeoutCardSx = { display: 'flex', borderRadius: 5, borderWidth: 2, boxShadow: 0, alignItems: 'center' };

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
    <Card sx={takeoutCardSx}>
      {imagePosition === 'left' ? (
        <CardMedia component="img" sx={{ height: '35vw' }} image={image} alt={title} />
      ) : null}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <CardContent>
          <Stack direction="row" spacing={2}>
            <Typography gutterBottom variant="h5" component="div" fontWeight="bold">
              {title}
            </Typography>
            <GoodChip isGood={isGood} />
          </Stack>
          <Typography variant="body1" color="text.primary" fontWeight="500">
            {fixedDescription}
          </Typography>
          <Typography variant="body1" color="text.primary" fontWeight="600">
            {resultDescription}
          </Typography>
        </CardContent>
      </Box>
      {imagePosition === 'right' ? (
        <CardMedia component="img" sx={{ height: '35vw' }} image={image} alt={title} />
      ) : null}
    </Card>
  );
}
