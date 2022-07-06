import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS, NormalizedLandmarkList, Results } from '@mediapipe/pose';
import { debug } from 'console';

/**
 * cnavasに描画する
 * @param ctx canvas context
 * @param results 手の検出結果
 */
export const drawCanvas = (ctx: CanvasRenderingContext2D, results: Results) => {
    const width = ctx.canvas.width
    const height = ctx.canvas.height

    ctx.save()
    ctx.clearRect(0, 0, width, height)
    // canvas の左右反転
    ctx.scale(-1, 1)
    ctx.translate(-width, 0)
    ctx.rotate(10 * (Math.PI / 180))
    // capture image の描画
    ctx.drawImage(results.image, 0, 0, width, height)
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {color: "white", lineWidth: 2});
    drawLandmarks(ctx, results.poseLandmarks, {color: "white", lineWidth: 1, radius: 2.5, fillColor: "lightgreen"});
    ctx.restore()
}
