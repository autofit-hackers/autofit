import PrintIcon from '@mui/icons-material/Print';
import { Button } from '@mui/material';

export default function PrintButton() {
  return (
    <Button variant="outlined" endIcon={<PrintIcon />}>
      Print
    </Button>
  );
}
