import { useCallback, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import Webcam from 'react-webcam';

export default function WebcamCapture() {
    const webcamRef = useRef<Webcam>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [capturing, setCapturing] = useState<boolean>(false);
    const [recordedBlobUrls, setRecordedBlobUrls] = useState<string[]>([]);

    // handleStopCaptureClickの直後に呼ばれる
    const handleRecordBlob = useCallback(({ data }: { data: Blob }) => {
        if (data.size > 0) {
            const url = URL.createObjectURL(data);
            setRecordedBlobUrls((prevUrls) => [...prevUrls, url]);
        }
    }, []);

    const handleStartCaptureClick = useCallback(() => {
        setCapturing(true);
        mediaRecorderRef.current = new MediaRecorder(webcamRef.current!.stream!, {
            mimeType: 'video/webm'
        });
        mediaRecorderRef.current.addEventListener('dataavailable', handleRecordBlob);
        mediaRecorderRef.current.start();
    }, [handleRecordBlob]);

    const handleStopCaptureClick = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setCapturing(false);
    }, [mediaRecorderRef, setCapturing]);

    return (
        <>
            <Webcam audio={false} ref={webcamRef} />
            {capturing ? (
                <button type="button" onClick={handleStopCaptureClick}>
                    Stop Capture
                </button>
            ) : (
                <button type="button" onClick={handleStartCaptureClick}>
                    Start Capture
                </button>
            )}
            <input type="number" />
            {recordedBlobUrls && (
                <ReactPlayer url={recordedBlobUrls.slice(-1)[0]} id="MainPlay" playing loop={false} controls={false} />
            )}
        </>
    );
}
