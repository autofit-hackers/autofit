import { Box } from '@mui/material';
import LatestSessionList from '../1_templates/LatestTrainingList';
import MenuList from '../1_templates/MenuList';
import dummyMenus from '../utils/dummyData.ts/dummyMenus';
import { dummySessions } from '../utils/dummyData.ts/dummySession';

export default function Top() {
  return (
    <Box sx={{ background: 'rgb(240,240,240)' }}>
      <LatestSessionList sessions={dummySessions} />
      <MenuList workoutMenus={dummyMenus} />
    </Box>
  );
}
