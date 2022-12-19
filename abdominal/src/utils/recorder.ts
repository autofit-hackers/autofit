const canvasRecorder = (canvas: HTMLCanvasElement): MediaRecorder => {
  const stream = canvas.captureStream();
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
  });
  const rec: { data: Array<Blob>; type: string } = { data: [], type: '' };
  recorder.ondataavailable = (e) => {
    rec.type = e.data.type;
    rec.data.push(e.data);
  };

  recorder.onstart = () => {
    // 開始10分でレコーダーを自動停止
    setTimeout(() => {
      if (recorder.state === 'recording') {
        window.log.debug('Finishing rep video recorder: 10 min passed since the recording started');
        recorder.stop();
      }
    }, 60000);
  };

  recorder.onstop = () => {
    const blob = new Blob(rec.data, { type: rec.type });
    if (blob.size > 0) {
      const url = URL.createObjectURL(blob);

      return { blob, url };
    }

    return null;
  };

  return recorder;
};

export default canvasRecorder;
