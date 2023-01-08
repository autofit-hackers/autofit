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
        src={set.videoUrl}
        autoPlay
        muted
        loop
        playsInline
        sx={{ width: '100%', objectFit: 'cover', height: '400px' }}
      />
      <Typography fontWeight={600}>トレーナーからのコメント</Typography>
      <Typography fontSize="small">{commentToDisplay?.comment}</Typography>
      <TrainerBioCard trainerId={commentToDisplay ? commentToDisplay.trainerId : '1'} />
    </>
  );
}
