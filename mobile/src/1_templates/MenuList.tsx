import { Box, Stack, Typography } from '@mui/material';
import MenuCard from '../0_parts/MenuCard';

interface MenuListProps {
  workouts: {
    title: string;
    image: string;
  }[];
}

export default function MenuList({ workouts }: MenuListProps) {
  return (
    <>
      <Typography sx={{ ml: 2, mt: 2, fontWeight: 700, fontSize: 'large' }}>種目ごとのログをみる</Typography>
      <Box sx={{ overflow: 'scroll' }}>
        <Stack direction="row" spacing={2} sx={{ width: `${workouts.length * 200 + 20}px`, m: 2 }}>
          {workouts.map((workout) => (
            <MenuCard title={workout.title} image={workout.image} />
          ))}
        </Stack>
      </Box>
    </>
  );
}
