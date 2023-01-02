import List from '@mui/material/List';
import { useState } from 'react';
import TrainingLogListItem from '../0_parts/TrainingLogListItem';

export default function TrainingLogList() {
  const [checked, setChecked] = useState([0]);

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
      {[0, 1, 2, 3].map((value) => (
        <TrainingLogListItem itemId={value} selectedItemIds={checked} setItemSelected={handleToggle} />
      ))}
    </List>
  );
}
