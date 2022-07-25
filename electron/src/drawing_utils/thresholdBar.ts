export const drawBarsFromTwoPoints = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w: number,
): void => {
  ctx.strokeStyle = 'red';
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
  acceptableError: number,
) => {
  drawBarsFromTwoPoints(ctx, x1, y1, x2, y2, w);
  if (x1 !== x2) {
    const a = (y2 - y1) / (x2 - x1);
    // cos = 1 / sqrt( 1 + tan^2 )
    // tan = -1/a
    const xError = acceptableError / Math.sqrt(1 + 1 / (a * a));
    drawBarsFromTwoPoints(ctx, x1, y1, x2, y2, w);
    drawBarsFromTwoPoints(ctx, x1 + xError, y1, x2 + xError, y2, w);
    drawBarsFromTwoPoints(ctx, x1 - xError, y1, x2 - xError, y2, w);
  } else {
    drawBarsFromTwoPoints(ctx, x1, y1, x2, y2, w);
    drawBarsFromTwoPoints(ctx, x1 + acceptableError, y1, x2 + acceptableError, y2, w);
    drawBarsFromTwoPoints(ctx, x1 - acceptableError, y1, x2 - acceptableError, y2, w);
  }
};
