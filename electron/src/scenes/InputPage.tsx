import AccountCircle from '@mui/icons-material/AccountCircle';
import DeblurIcon from '@mui/icons-material/Deblur';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useState } from 'react';
import 'typeface-roboto';
import { phaseAtom } from './atoms';

export default function InputPage() {
  const [, setPhase] = useAtom(phaseAtom);
  const [subjectName, setSubjectName] = useState('名無し');
  const [trainingName, setTrainingName] = useState('スクワット');
  const [targetWeight, setTargetWeight] = useState(0);
  const [targetReps, setTargetReps] = useState(8);

  return (
    <>
      <Typography>はじめに、名前やトレーニング情報を入力してください</Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
        <AccountCircle sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
        <TextField
          id="input-name"
          label="名前"
          variant="standard"
          onChange={(newValue) => setSubjectName(newValue.target.value)}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
        <RestaurantMenuIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
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
        <FitnessCenterIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
        <TextField
          id="input-weight"
          label="重量"
          variant="standard"
          type="number"
          onChange={(newValue) => setTargetWeight(newValue.target.value as unknown as number)}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
        <DeblurIcon sx={{ color: 'action.active', mr: 1, my: 0.5 }} />
        <TextField
          id="input-reps"
          label="回数"
          variant="standard"
          type="number"
          onChange={(newValue) => setTargetReps(newValue.target.value as unknown as number)}
        />
      </Box>
      <Button
        onClick={() => {
          setPhase((prevPhase) => prevPhase + 1);
        }}
      >
        {subjectName}さん、{targetWeight}kgで{targetReps}回{trainingName}を開始する
      </Button>
    </>
  );
}
