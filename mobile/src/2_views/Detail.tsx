import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TrainerCommentCard from '../0_parts/TrainerCommentCard';
import TrainingLogList from '../1_templates/TrainingLogList';
import { Comment, Set } from '../utils/training';

interface DetailProps {
  date: string;
}

export default function Detail() {
  const location = useLocation();
  const { date } = location.state as DetailProps;

  // データ取得
  const [sets, setSets] = useState<Set[] | undefined>(undefined);
  const [comments, setComments] = useState<Comment[] | undefined>(undefined);

  async function fetchSets(url: string) {
    try {
      const response = await fetch(url);
      const json = (await response.json()) as Set[];
      setSets(json);
    } catch (error) {
      console.error(error);
    }
  }
  async function fetchComments(url: string) {
    try {
      const response = await fetch(url);
      const json = (await response.json()) as Comment[];
      setComments(json);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    void fetchSets('https://abdominal-development.s3.us-west-2.amazonaws.com/api/v1/sets');
    void fetchComments('https://abdominal-development.s3.us-west-2.amazonaws.com/api/v1/comments');
  }, []);

  return (
    <Stack spacing={1} sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <IconButton size="small" component={Link} to="/">
          <ArrowBackIosIcon />
        </IconButton>
        <Typography fontWeight={600}>{date}</Typography>
      </Stack>
      {sets && comments ? (
        <>
          <Typography fontWeight={600}>ハイライト動画</Typography>
          <TrainerCommentCard set={sets[0]} comments={comments} />
          <Typography fontWeight={600}>トレーニング記録</Typography>
          <TrainingLogList sets={sets} />
        </>
      ) : (
        <CircularProgress />
      )}
    </Stack>
  );
}
