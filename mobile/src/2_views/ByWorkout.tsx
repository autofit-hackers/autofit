import { Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { VictoryChart, VictoryLine } from 'victory';
import ByWorkoutList from '../1_templates/ByWorkoutList';
import { Session } from '../utils/training';

interface ByWorkoutProps {
  workoutName: string;
}

export default function ByWorkout() {
  const location = useLocation();
  const { workoutName } = location.state as ByWorkoutProps;

  const [sessions, setSessions] = useState<Session[] | undefined>(undefined);
  const [sessionDataList, setSessionDataList] = useState<{ x: string; y: number }[] | undefined>(undefined);

  const createSessionDataList = (targetSessions: Session[]) => {
    const targetSessionDataList = targetSessions.map((session) => {
      const date = new Date(session.date);
      const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

      return {
        x: dateStr,
        y: session.maxWeight,
      };
    });

    return targetSessionDataList;
  };

  useEffect(() => {
    async function fetchSessions(url: string) {
      try {
        const response = await fetch(url);
        const json = (await response.json()) as Session[];
        setSessions(json);
        setSessionDataList(createSessionDataList(json));
      } catch (error) {
        console.error(error);
      }
    }
    void fetchSessions('https://abdominal-development.s3.us-west-2.amazonaws.com/api/v1/sessions');
  }, []);

  return (
    <>
      <Typography>{workoutName}</Typography>
      <VictoryChart>
        <VictoryLine data={sessionDataList} interpolation="natural" />
      </VictoryChart>
      {sessions ? <ByWorkoutList sessions={sessions} /> : <p>loading...</p>}
      <Link to="/">Top</Link>
    </>
  );
}
