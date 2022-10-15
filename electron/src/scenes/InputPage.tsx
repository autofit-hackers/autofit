import AccountCircle from '@mui/icons-material/AccountCircle';
import DeblurIcon from '@mui/icons-material/Deblur';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { Backdrop, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useState } from 'react';
import 'typeface-roboto';
import { resetSet } from '../training_data/set';
import { phaseAtom, setRecordAtom } from './atoms';
import LoadingScreen from './LoadingScreen';

export default function InputPage() {
  const [, setPhase] = useAtom(phaseAtom);
  const [, setSetRecord] = useAtom(setRecordAtom);
  const [subjectName, setSubjectName] = useState('名無し');
  const [trainingName, setTrainingName] = useState('スクワット');
  const [targetWeight, setTargetWeight] = useState(0);
  const [targetReps, setTargetReps] = useState(8);
  const [open, setOpen] = useState(false);

  const submitForm = () => {
    setOpen(true);
    setPhase((prevPhase) => prevPhase + 1);
    setSetRecord(resetSet({ userName: subjectName, exerciseName: trainingName, targetWeight, targetReps }));
  };

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
          defaultValue="スクワット"
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
          defaultValue={8}
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
      <Backdrop
        sx={{ color: '#FFFFFF', zIndex: 10 }}
        open={open}
        onClick={() => {
          setOpen(false);
        }}
      >
        <LoadingScreen />
      </Backdrop>
    </Stack>
  );
}
