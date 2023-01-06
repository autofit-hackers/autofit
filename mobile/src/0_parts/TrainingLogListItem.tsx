import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/YouTube';
import { CardMedia, Collapse, IconButton, ListItem, ListItemText, Stack } from '@mui/material';
import { Set } from '../utils/training';

interface TrainingLogListItemProps {
  itemId: number;
  selectedItemIds: number[];
  setItemSelected: (itemId: number) => void;
  set: Set;
}

export default function TrainingLogListItem({
  itemId,
  selectedItemIds,
  setItemSelected,
  set,
}: TrainingLogListItemProps) {
  const labelId = `checkbox-list-label-${itemId}`;

  return (
    <ListItem key={itemId} disablePadding>
      <Stack width="100%">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <ListItemText id={labelId} primary={`${itemId + 1}. ${set.workoutName} ${set.weight}kg × ${set.reps}回`} />
          <IconButton
            color="primary"
            aria-label="upload picture"
            onClick={() => {
              setItemSelected(itemId);
            }}
          >
            {selectedItemIds.includes(itemId) ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Stack>
        <Collapse in={selectedItemIds.includes(itemId)} timeout="auto" unmountOnExit>
          <CardMedia
            component="video"
            src={set.videoUrl}
            autoPlay
            controls
            muted
            sx={{ width: '100%', objectFit: 'contain' }}
          />
        </Collapse>
      </Stack>
    </ListItem>
  );
}
