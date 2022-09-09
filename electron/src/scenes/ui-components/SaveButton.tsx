import SaveAsIcon from '@mui/icons-material/SaveAs';
import { IconButton } from '@mui/material';
import dayjs from 'dayjs';
import { createWriteStream } from 'streamsaver';

function SaveButton(props: { object: object; videoUrls: string[] }) {
  const { object, videoUrls } = props;

  const exportJson = (data: object, now: string) => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `setRecord_${now}.json`;

    link.click();
  };

  const downloadVideo = async (url: string, fileName: string) => {
    await fetch(url).then(async (response) => {
      const blob = response.body;
      const fileSize = Number(response.headers.get('content-length'));
      const fileStream = createWriteStream(fileName, { size: fileSize }) as WritableStream<Uint8Array>;

      if (blob != null) {
        await blob.pipeTo(fileStream);
      }
    });
  };

  // TODO: 映像を保存する際にURL個数分のダイアログが出る
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
