import { Box, CircularProgress } from '@mui/material';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import Header from '../1_templates/Header';
import LatestSessionList from '../1_templates/LatestTrainingList';
import MenuList from '../1_templates/MenuList';
import { trainerAtom } from '../utils/atoms';
import dummyMenus from '../utils/dummyData.ts/dummyMenus';
import { Session, Trainer } from '../utils/training';

export default function Top() {
  const [sessions, setSessions] = useState<Session[] | undefined>(undefined);
  const [, setTrainers] = useAtom(trainerAtom);

  useEffect(() => {
    async function fetchSessions(url: string) {
      try {
        const response = await fetch(url);
        const json = (await response.json()) as Session[];
        setSessions(json);
      } catch (error) {
        console.error(error);
      }
    }

    async function fetchTrainers(url: string) {
      try {
        const response = await fetch(url);
        const json = (await response.json()) as Trainer[];
        setTrainers(json);
      } catch (error) {
        console.error(error);
      }
    }

    void fetchSessions('https://abdominal-development.s3.us-west-2.amazonaws.com/api/v1/sessions');
    void fetchTrainers('https://abdominal-development.s3.us-west-2.amazonaws.com/api/v1/trainers');
  }, [setTrainers]);

  return (
    <>
      <Header title="autofit" />
      <Box sx={{ background: 'rgb(240,240,240)' }}>
        {sessions ? <LatestSessionList sessions={sessions} /> : <CircularProgress />}
        <MenuList workoutMenus={dummyMenus} />
      </Box>
    </>
  );
}
