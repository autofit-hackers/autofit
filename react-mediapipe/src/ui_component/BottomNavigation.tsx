import FavoriteIcon from '@mui/icons-material/Favorite';
import FolderIcon from '@mui/icons-material/Folder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RestoreIcon from '@mui/icons-material/Restore';
import StarIcon from '@mui/icons-material/Star';
import { Paper } from '@mui/material';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import * as React from 'react';
import { Link } from 'react-router-dom';

export default function LabelBottomNavigation() {
  const [value, setValue] = React.useState('main');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      <BottomNavigation sx={{ width: '100vw' }} value={value} onChange={handleChange}>
        <BottomNavigationAction label="Main" value="main" icon={<StarIcon />} component={Link} to="/" />
        <BottomNavigationAction label="Endo" value="endo" icon={<RestoreIcon />} component={Link} to="/endo" />
        <BottomNavigationAction label="Kondo" value="kondo" icon={<FavoriteIcon />} component={Link} to="/kondo" />
        <BottomNavigationAction label="Ueno" value="ueno" icon={<LocationOnIcon />} component={Link} to="/ueno" />
        <BottomNavigationAction label="Katsura" value="katsura" icon={<FolderIcon />} component={Link} to="/katsura" />
      </BottomNavigation>
    </Paper>
  );
}
