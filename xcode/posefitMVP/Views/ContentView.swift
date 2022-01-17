import SwiftUI
import AVFoundation

struct ContentView: View {
    let videoCapture = VideoCapture()
    @State var image: UIImage? = nil
    @State var name: String = ""
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
                        }
                    }
                }
                Button("stop") {
                    videoCapture.stop()
                }
            }
            .font(.largeTitle)
        }
    }

    func UIImageFromSampleBuffer(_ sampleBuffer: CMSampleBuffer) -> UIImage? {
        if let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) {
            let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
            let imageRect = CGRect(x: 0, y: 0, width: CVPixelBufferGetWidth(pixelBuffer), height: CVPixelBufferGetHeight(pixelBuffer))
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
