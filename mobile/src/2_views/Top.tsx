import { Box, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import Header from '../1_templates/Header';
import LatestSessionList from '../1_templates/LatestTrainingList';
import MenuList from '../1_templates/MenuList';
import dummyMenus from '../utils/dummyData.ts/dummyMenus';
import { Session } from '../utils/training';

export default function Top() {
  const [session, setSession] = useState<Session[] | undefined>(undefined);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('https://abdominal-development.s3.us-west-2.amazonaws.com/api/v0/sessions');
        const json = (await response.json()) as Session[];
        setSession(json);
      } catch (error) {
        console.error(error);
      }
    }

    void fetchData();
  }, []);

  return (
    <>
      <Header title="autofit" />
      <Box sx={{ background: 'rgb(240,240,240)' }}>
        {session ? <LatestSessionList sessions={session} /> : <CircularProgress />}
        <MenuList workoutMenus={dummyMenus} />
      </Box>
    </>
  );
}
