import { Box, Stack, Typography } from '@mui/material';
import MenuCard from '../0_parts/MenuCard';
import { WorkoutMenu } from '../utils/training';

interface MenuListProps {
  workoutMenus: WorkoutMenu[];
}

export default function MenuList({ workoutMenus }: MenuListProps) {
  return (
    <>
      <Typography sx={{ ml: 2, mt: 2, fontWeight: 700, fontSize: 'large' }}>種目ごとのログをみる</Typography>
      <Box sx={{ overflow: 'scroll' }}>
        <Stack direction="row" spacing={2} sx={{ width: `${workoutMenus.length * 200 + 220}px`, m: 2 }}>
          {workoutMenus.map((workout) => (
            <MenuCard workoutMenu={workout} />
          ))}
        </Stack>
      </Box>
    </>
  );
}
