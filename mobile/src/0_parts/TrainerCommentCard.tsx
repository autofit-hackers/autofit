import { CardMedia, Typography } from '@mui/material';
import { Comment, Set } from '../utils/training';
import TrainerBioCard from './TrainerBioCard';

interface TrainerCommentCardProps {
  set: Set;
  comments: Comment[];
}

export default function TrainerCommentCard({ set, comments }: TrainerCommentCardProps) {
  const commentToDisplay = comments.find((comment) => comment.setId === set.id);

  return (
    <>
      <CardMedia
        component="video"
        src="https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4"
        autoPlay
        controls
        muted
        sx={{ width: '100%', objectFit: 'contain' }}
      />
      <Typography fontWeight={600}>トレーナーからのコメント</Typography>
      <Typography fontSize="small">{commentToDisplay?.comment}</Typography>
      <TrainerBioCard trainerId={commentToDisplay ? commentToDisplay.trainerId : '1'} />
    </>
  );
}
