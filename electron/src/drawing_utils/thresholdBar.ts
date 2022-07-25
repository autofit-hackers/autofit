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

export const hoge = 1;
