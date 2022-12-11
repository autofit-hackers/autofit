import labels from './labels.json';

/**
 * Render prediction boxes
 * @param {HTMLCanvasElement} canvasRef canvas tag reference
 * @param {number} classThreshold class threshold
 * @param {Array} boxesData boxes array
 * @param {Array} scoresData scores array
 * @param {Array} classesData class array
 */
const renderBoxes = (
  canvasRef: HTMLCanvasElement,
  classThreshold: number,
  boxesData: number[],
  scoresData: number[],
  classesData: number[],
) => {
  const ctx = canvasRef.getContext('2d');
  if (ctx == null) throw new Error('Canvas context is null');

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clean canvas

  // font configs
  const font = '20px sans-serif';
  ctx.font = font;
  ctx.textBaseline = 'top';

  for (let i = 0; i < scoresData.length; i += 1) {
    // filter based on class threshold
    if (scoresData[i] > classThreshold) {
      const klass = labels[classesData[i]];
      const score = (scoresData[i] * 100).toFixed(1);

      let [x1, y1, x2, y2] = boxesData.slice(i * 4, (i + 1) * 4);
      x1 *= canvasRef.width;
      x2 *= canvasRef.width;
      y1 *= canvasRef.height;
      y2 *= canvasRef.height;
      const width = x2 - x1;
      const height = y2 - y1;

      // Draw the bounding box.
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(x1, y1, width, height);

      // Draw the label background.
      ctx.fillStyle = '#00FF00';
      const textWidth = ctx.measureText(`${klass} - ${score}%`).width;
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
      ctx.fillText(`${klass} - ${score}%`, x1 - 1, yText < 0 ? 0 : yText);
    }
  }
};

export default renderBoxes;
