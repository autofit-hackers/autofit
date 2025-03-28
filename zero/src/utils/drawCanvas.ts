export const renderBGRA32ColorFrame = (ctx: CanvasRenderingContext2D, canvasImageData: ImageData, imageFrame: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  const newPixelData = Buffer.from(imageFrame.imageData);
  const { width } = canvasImageData;
  const pixelArray = canvasImageData.data;

  // Flip the image horizontally
  for (let i = 0; i < canvasImageData.data.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor(i / 4 / width);
    const newX = width - x - 1;
    const newY = y;
    const newI = (newY * width + newX) * 4;
    pixelArray[newI] = newPixelData[i + 2];
    pixelArray[newI + 1] = newPixelData[i + 1];
    pixelArray[newI + 2] = newPixelData[i];
    pixelArray[newI + 3] = 0xff;
  }

  // 取得映像の両端1/4をカットして貼り付ける
  ctx.putImageData(
    canvasImageData,
    -canvasImageData.width / 4,
    0,
    canvasImageData.width / 4,
    0,
    canvasImageData.width / 2,
    canvasImageData.height,
  );
};

export const drawBarsFromTwoPoints = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w: number,
  color: string,
): void => {
  ctx.strokeStyle = color;
  if (x1 !== x2) {
    const a = (y2 - y1) / (x2 - x1);
    const yFrom = -x1 * a + y1;
    const yTo = (w - x1) * a + y1;
    ctx.beginPath();
    ctx.moveTo(0, yFrom);
    ctx.lineTo(w, yTo);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x1, 0);
    ctx.lineTo(x2, 10000);
    ctx.stroke();
  }
};

export const drawBarsWithAcceptableError = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w: number,
  allowableUpperLimit: number,
  allowableLowerLimit: number,
) => {
  drawBarsFromTwoPoints(ctx, x1, y1, x2, y2, w, 'red');
  if (x1 !== x2) {
    const a = (y2 - y1) / (x2 - x1);
    // cos = 1 / sqrt( 1 + tan^2 )
    // tan = -1/a
    const xUpperLimit = allowableUpperLimit * Math.sqrt(1 + 1 / (a * a));
    const xLowerLimit = allowableLowerLimit * Math.sqrt(1 + 1 / (a * a));
    drawBarsFromTwoPoints(ctx, x1, y1, x2, y2, w, 'red');
    drawBarsFromTwoPoints(ctx, x1 + xUpperLimit, y1, x2 + xUpperLimit, y2, w, 'red');
    drawBarsFromTwoPoints(ctx, x1 - xLowerLimit, y1, x2 - xLowerLimit, y2, w, 'red');
  } else {
    drawBarsFromTwoPoints(ctx, x1, y1, x2, y2, w, 'red');
    drawBarsFromTwoPoints(ctx, x1 + allowableUpperLimit, y1, x2 + allowableUpperLimit, y2, w, 'red');
    drawBarsFromTwoPoints(ctx, x1 - allowableLowerLimit, y1, x2 - allowableLowerLimit, y2, w, 'red');
  }
};
