import AccountCircle from '@mui/icons-material/AccountCircle';
import DeblurIcon from '@mui/icons-material/Deblur';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import 'typeface-roboto';
import { resetSet } from '../training_data/set';
import { phaseAtom, setRecordAtom } from './atoms';

export default function InputPage() {
  const [, setPhase] = useAtom(phaseAtom);
  const [, setSetRecord] = useAtom(setRecordAtom);
  const [subjectName, setSubjectName] = useState('Yusuke Kondo');
  const [trainingName, setTrainingName] = useState('スクワット');
  const [targetWeight, setTargetWeight] = useState(20);
  const [targetReps, setTargetReps] = useState(5);
  const [startTime] = useState(dayjs().format('YYYY-MM-DD-HH-mm-ss'));

  const submitForm = () => {
    setPhase((prevPhase) => prevPhase + 1);
    setSetRecord(resetSet({ userName: subjectName, exerciseName: trainingName, targetWeight, targetReps, startTime }));
  };

  useEffect(() => {
    void navigator.mediaDevices.enumerateDevices().then((devices) => {
      console.log(devices.filter(({ kind }) => kind === 'videoinput'));
    });
  }, []);

  return (
    <Stack spacing={8} alignItems="center">
      <Typography variant="h6" style={{ marginTop: '50px', fontWeight: 'bold' }}>
        はじめに、名前やトレーニング情報を入力してください。
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
        <AccountCircle sx={{ color: '#4AC0E3', mr: 1, my: 0.5 }} />
        <TextField
          id="input-name"
          label="名前"
          variant="standard"
          defaultValue={subjectName}
          onChange={(newValue) => setSubjectName(newValue.target.value)}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
        <RestaurantMenuIcon sx={{ color: '#4AC0E3', mr: 1, my: 0.5 }} />
        <TextField
          id="input-training-name"
          label="種目"
          variant="standard"
          InputProps={{
            readOnly: true,
          }}
          defaultValue={trainingName}
          onChange={(newValue) => setTrainingName(newValue.target.value)}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
        <FitnessCenterIcon sx={{ color: '#4AC0E3', mr: 1, my: 0.5 }} />
        <TextField
          id="input-weight"
          label="重量"
          variant="standard"
          type="number"
          defaultValue={targetWeight}
          onChange={(newValue) => setTargetWeight(newValue.target.value as unknown as number)}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
        <DeblurIcon sx={{ color: '#4AC0E3', mr: 1, my: 0.5 }} />
        <TextField
          id="input-reps"
          label="回数"
          variant="standard"
          type="number"
          defaultValue={targetReps}
          onChange={(newValue) => setTargetReps(newValue.target.value as unknown as number)}
        />
      </Box>
      <Button
        variant="outlined"
        size="large"
        style={{ marginTop: '50px', fontWeight: 'bold', borderWidth: '4px', borderRadius: '20px' }}
        onClick={submitForm}
      >
        {subjectName}さん、{targetWeight}kgで{targetReps}回{trainingName}を開始する
      </Button>
    </Stack>
  );
}
