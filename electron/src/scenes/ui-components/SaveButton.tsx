import SaveAsIcon from '@mui/icons-material/SaveAs';
import { IconButton } from '@mui/material';
import dayjs from 'dayjs';
import { downloadVideo } from '../../utils/recordVideo';

function SaveButton(props: { object: object; videoUrls: string[] }) {
  const { object, videoUrls } = props;

  const exportJson = (data: object, now: string) => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `setRecord_${now}.json`;

    link.click();
  };

  const handleSave = () => {
    const now = `${dayjs().format('MM-DD-HH-mm-ss')}`;
    exportJson(object, now);
    for (let i = 0; i < videoUrls.length; i += 1) {
      void downloadVideo(videoUrls[i], `video-${now}_rep${i + 1}.mp4`);
    }
  };

  return (
    <IconButton onClick={handleSave}>
      <SaveAsIcon />
    </IconButton>
  );
}

export default SaveButton;
