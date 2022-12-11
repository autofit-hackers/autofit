/**
 * Class to handle webcam
 */
class Webcam {
  /**
   * Open webcam and stream it through video tag.
   */
  open = (videoRef: HTMLVideoElement) => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: 'environment',
          },
        })
        .then((stream) => {
          videoRef.srcObject = stream;
        });
    } else alert("Can't open Webcam!");
  };

  /**
   * Close opened webcam.
   */
  close = (videoRef: HTMLVideoElement) => {
    if (videoRef.srcObject) {
      videoRef.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
      videoRef.srcObject = null;
    } else alert('Please open Webcam first!');
  };
}

export default Webcam;
