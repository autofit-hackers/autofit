import labels from './labels.json';

/**
 * Render prediction boxes
 */
const renderBoxes = (
  canvas: HTMLCanvasElement,
  classThreshold: number,
  boxesData: Float32Array | Int32Array | Uint8Array | undefined,
  scoresData: Float32Array | Int32Array | Uint8Array | undefined,
  classesData: Float32Array | Int32Array | Uint8Array | undefined,
) => {
  const ctx = canvas.getContext('2d');
  if (ctx == null) throw new Error('Canvas context is null');
  if (boxesData === undefined || scoresData === undefined || classesData === undefined) return;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // font configs
  const font = '20px sans-serif';
  ctx.font = font;
  ctx.textBaseline = 'top';

  for (let i = 0; i < scoresData.length; i += 1) {
    // filter based on class threshold
    if (scoresData[i] > classThreshold) {
      const label = labels[classesData[i]];
      const score = (scoresData[i] * 100).toFixed(1);

      let [x1, y1, x2, y2] = boxesData.slice(i * 4, (i + 1) * 4);
      x1 *= canvas.width;
      x2 *= canvas.width;
      y1 *= canvas.height;
      y2 *= canvas.height;
      const width = x2 - x1;
      const height = y2 - y1;

      // Draw the bounding box.
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(x1, y1, width, height);

      // Draw the label background.
      ctx.fillStyle = '#00FF00';
      const textWidth = ctx.measureText(`${label} - ${score}%`).width;
      const textHeight = parseInt(font, 10); // base 10
      const yText = y1 - (textHeight + ctx.lineWidth);
      ctx.fillRect(
        x1 - 1,
        yText < 0 ? 0 : yText, // handle overflow label box
        textWidth + ctx.lineWidth,
        textHeight + ctx.lineWidth,
      );

      // Draw labels
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${label} - ${score}%`, x1 - 1, yText < 0 ? 0 : yText);
    }
  }
};

export default renderBoxes;
