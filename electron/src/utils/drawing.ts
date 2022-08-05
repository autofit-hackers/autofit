export const renderBGRA32ColorFrame = (ctx: CanvasRenderingContext2D, canvasImageData: ImageData, imageFrame: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  const newPixelData = Buffer.from(imageFrame.imageData);
  const pixelArray = canvasImageData.data;
  for (let i = 0; i < canvasImageData.data.length; i += 4) {
    pixelArray[i] = newPixelData[i + 2];
    pixelArray[i + 1] = newPixelData[i + 1];
    pixelArray[i + 2] = newPixelData[i];
    pixelArray[i + 3] = 0xff;
  }
  ctx.putImageData(canvasImageData, 0, 0);
};

// sideを描画する
export const renderSideFrame = (ctx: CanvasRenderingContext2D, canvasImageData: ImageData) => {
  const pixelArray = canvasImageData.data;
  for (let i = 0; i < canvasImageData.data.length; i += 4) {
    // NOTE: 背景を水色にする
    pixelArray[i] = 0;
    pixelArray[i + 1] = 0xff;
    pixelArray[i + 2] = 0xff;
    pixelArray[i + 3] = 0xff;
  }
  ctx.putImageData(canvasImageData, 0, 0);
};

// frontを描画する
export const renderFrontFrame = (ctx: CanvasRenderingContext2D, canvasImageData: ImageData) => {
  const pixelArray = canvasImageData.data;
  for (let i = 0; i < canvasImageData.data.length; i += 4) {
    // NOTE: 背景を水色にする
    pixelArray[i] = 0;
    pixelArray[i + 1] = 0xff;
    pixelArray[i + 2] = 0xff;
    pixelArray[i + 3] = 0xff;
  }
  ctx.putImageData(canvasImageData, 0, 0);
};
