import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { IconButton, Stack, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import TrainerCommentCard from '../0_parts/TrainerCommentCard';
import TrainingLogList from '../1_templates/TrainingLogList';
import { Comment, Set } from '../utils/training';

interface DetailProps {
  sets: Set[];
  comments: Comment[];
  date: string;
}

export default function Detail() {
  const location = useLocation();
  const { sets, comments, date } = location.state as DetailProps;

  return (
    <Stack spacing={1} sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <IconButton size="small" component={Link} to="/">
          <ArrowBackIosIcon />
        </IconButton>
        <Typography fontWeight={600}>{date}</Typography>
      </Stack>
      <Typography fontWeight={600}>ハイライト動画</Typography>
      <TrainerCommentCard set={sets[0]} comments={comments} />
      <Typography fontWeight={600}>トレーニング記録</Typography>
      <TrainingLogList sets={sets} />
    </Stack>
  );
}
