import SwiftUI
import AVFoundation
import MLKit
import MLImage

struct ContentView: View {
    let videoCapture = VideoCapture()
    let jointsPickerUtil = JointsPickerUtil()
//    let options = PoseDetectorOptions()
//        .detectorMode = .singleImage
//        options.detectorMode = .stream
//        let options = AccuratePoseDetectorOptions()
    let poseDetector = PoseDetector.poseDetector(options: PoseDetectorOptions())
    @State var image: UIImage? = nil
    let tmp: String = ""
    @State var filename: String = ""
    var body: some View {
        VStack {
            if let image = image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
            }
            HStack {
                Button("run") {
                    videoCapture.run { sampleBuffer in
                        if let convertImage = UIImageFromSampleBuffer(sampleBuffer) {
                            DispatchQueue.main.async {
                                self.image = convertImage
                            }
                            jointsPickerUtil.detectPose(uiImage: convertImage, filename: filename, poseDetector: poseDetector)
                        }
                    }
                }
                Button("stop") {
                    videoCapture.stop()
                }
            }
            .font(.largeTitle)
            TextField("Enter File Name", text: $filename)
                .font(.title)
                .textFieldStyle(RoundedBorderTextFieldStyle())
        }
    }

    func UIImageFromSampleBuffer(_ sampleBuffer: CMSampleBuffer) -> UIImage? {
        if let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) {
            let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
            let imageRect = CGRect(x: 0, y: 0, width: CVPixelBufferGetWidth(pixelBuffer), height: CVPixelBufferGetHeight(pixelBuffer))
//            print(CVPixelBufferGetWidth(pixelBuffer),CVPixelBufferGetHeight(pixelBuffer))
            //width=1080,height=1920
            let context = CIContext()
            if let image = context.createCGImage(ciImage, from: imageRect) {
                return UIImage(cgImage: image)
            }
        }
        return nil
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
