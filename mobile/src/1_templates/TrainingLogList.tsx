import List from '@mui/material/List';
import { useState } from 'react';
import TrainingLogListItem from '../0_parts/TrainingLogListItem';
import { Set } from '../utils/training';

interface TrainingLogListProps {
  sets: Set[];
}

export default function TrainingLogList({ sets }: TrainingLogListProps) {
  const [checked, setChecked] = useState<number[]>([]);

  const handleToggle = (value: number) => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {sets.map((set, index) => (
        <TrainingLogListItem itemId={index} selectedItemIds={checked} setItemSelected={handleToggle} set={set} />
      ))}
    </List>
  );
}
