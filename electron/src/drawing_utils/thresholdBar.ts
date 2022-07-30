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
  acceptableErrorUp: number,
  acceptableErrorDown: number,
) => {
  drawBarsFromTwoPoints(ctx, x1, y1, x2, y2, w, 'red');
  if (x1 !== x2) {
    const a = (y2 - y1) / (x2 - x1);
    // cos = 1 / sqrt( 1 + tan^2 )
    // tan = -1/a
    const xErrorUp = acceptableErrorUp * Math.sqrt(1 + 1 / (a * a));
    const xErrorDown = acceptableErrorDown * Math.sqrt(1 + 1 / (a * a));
    drawBarsFromTwoPoints(ctx, x1, y1, x2, y2, w, 'red');
    drawBarsFromTwoPoints(ctx, x1 + xErrorUp, y1, x2 + xErrorUp, y2, w, 'red');
    drawBarsFromTwoPoints(ctx, x1 - xErrorDown, y1, x2 - xErrorDown, y2, w, 'red');
  } else {
    drawBarsFromTwoPoints(ctx, x1, y1, x2, y2, w, 'red');
    drawBarsFromTwoPoints(ctx, x1 + acceptableErrorUp, y1, x2 + acceptableErrorUp, y2, w, 'red');
    drawBarsFromTwoPoints(ctx, x1 - acceptableErrorDown, y1, x2 - acceptableErrorDown, y2, w, 'red');
  }
};
