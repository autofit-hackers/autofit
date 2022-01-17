//
//  JointsPickerUtil.swift
//  posefitMVP
//
//  Created by 遠藤聡志 on 2022/01/13.
//

import Foundation
import MLKit
import MLImage

struct JointPos: Codable {
    let x: Float
    let y: Float
    let z: Float
}

// ViewController.swift の detectPose を呼んでいる
public class JointsPickerUtil{
    /// Initialized when one of the pose detector rows are chosen. Reset to `nil` when neither are.
    private var poseDetector: PoseDetector?
    
    private func detectPose(in image: MLImage, width: CGFloat, height: CGFloat){
        // unwraping
        if let poseDetector = poseDetector {
            var poses: [Pose]
            do {
                poses = try poseDetector.results(in: image)
            } catch {
                print("Failed to detect poses with error: \(error.localizedDescription).")
//                updatePreviewOverlayViewWithLastFrame()
                return
            }
//            updatePreviewOverlayViewWithLastFrame()
            guard !poses.isEmpty else {
                print("Pose detector returned no results.")
                return
            }
            weak var weakSelf = self
            let encoder = JSONEncoder()
            DispatchQueue.main.sync {
                guard let strongSelf = weakSelf else {
                    print("Self is nil!")
                    return
                }
                // 1 frame に予測した関節位置を持つリスト
                // let jointPoses: [Dictionary<Int,JointPos>]
                // Pose detected. Currently, only single person detection is supported.
                poses.forEach { pose in
//                    let poseOverlayView = UIUtilities.createPoseOverlayView(
//                        forPose: pose,
//                        inViewWithBounds: strongSelf.annotationOverlayView.bounds,
//                        lineWidth: Constant.lineWidth,
//                        dotRadius: Constant.smallDotRadius,
//                        positionTransformationClosure: { position -> CGPoint in
//                            strongSelf.normalizedPoint(
//                                fromVisionPoint: position, width: width, height: height
//                            )
//                        }
//                    )
                    // 可視化
//                    strongSelf.annotationOverlayView.addSubview(poseOverlayView)
                    var oneFrame: [String: JointPos] = [:]

                    // JSON化
                    for landmarkType in landmarkTypes {
                        let poseLandmark = pose.landmark(ofType: landmarkType)
                        let jointName = landmarkType.rawValue
                        let jointPos = JointPos(
                            x: Float(poseLandmark.position.x),
                            y: Float(poseLandmark.position.y),
                            z: Float(poseLandmark.position.z)
                        )
                        print(jointName)
                        print(jointPos)
                        oneFrame.updateValue(jointPos, forKey: jointName)
                    }
                    // JSON化
                    // one line json にするためにpretty printはしない
                    // encoder.outputFormatting = .prettyPrinted
                    let encodedData: Data
                    do {
                        encodedData = try encoder.encode(oneFrame)
                    } catch {
                        encodedData = Data()
                    }
                    let jsonString = String(data: encodedData, encoding: .utf8)! + "\n"
                    // 書き出し
                    let outputFilename = getNowStr() + ".json"
                    print(outputFilename)
                    addTextToFile(text: jsonString, outputFilename: outputFilename)
                }
            }
        }
    }
    
    private func uiImageToMLImage(uiImage: UIImage) -> MLImage?{
        let mlImage = MLImage(image: uiImage)
        mlImage!.orientation = uiImage.imageOrientation
        return mlImage
    }
    
    private func getNowStr() -> String {
        // 現在時間をStringとして取得する
        let f = DateFormatter()
        f.locale = Locale(identifier: "ja_JP")
        f.timeZone = TimeZone(identifier: "Asia/Tokyo")
        f.dateFormat = "yyyy-MM-dd-HH-mm"
        let now = Date()
        return f.string(from: now)
    }
    
    private func addTextToFile(text: String, outputFilename: String) {
        // .documentDirectory配下にtextをoutputFilenameで保存する
        let dataToWrite = text.data(using: .utf8)!
        let dir = FileManager.default.urls(
            for: .documentDirectory,
            in: .userDomainMask
        ).first!
        print(dir.path)
        let fileUrl = dir.appendingPathComponent(outputFilename)
        if FileManager.default.fileExists(atPath: fileUrl.path) {
            // ファイルが存在したら追記
            let fileHandler = FileHandle(forWritingAtPath: fileUrl.path)!
            fileHandler.seekToEndOfFile()
            fileHandler.write(dataToWrite)
            fileHandler.closeFile()
            print(fileUrl)
        } else {
            // ファイルが存在しなければ作成
            if FileManager.default.createFile(
                atPath: fileUrl.path,
                contents: dataToWrite,
                attributes: nil
            ) {
                print("file successfully created")
                print(fileUrl)
            } else {
                print("failed to create file")
            }
        }
    }
    
    private let landmarkTypes = [
        PoseLandmarkType.nose,
        PoseLandmarkType.leftEyeInner,
        PoseLandmarkType.leftEye,
        PoseLandmarkType.leftEyeOuter,
        PoseLandmarkType.rightEyeInner,
        PoseLandmarkType.rightEye,
        PoseLandmarkType.rightEyeOuter,
        PoseLandmarkType.leftEar,
        PoseLandmarkType.rightEar,
        PoseLandmarkType.mouthLeft,
        PoseLandmarkType.mouthRight,
        PoseLandmarkType.leftShoulder,
        PoseLandmarkType.rightShoulder,
        PoseLandmarkType.leftElbow,
        PoseLandmarkType.rightElbow,
        PoseLandmarkType.leftWrist,
        PoseLandmarkType.rightWrist,
        PoseLandmarkType.leftPinkyFinger,
        PoseLandmarkType.rightPinkyFinger,
        PoseLandmarkType.leftIndexFinger,
        PoseLandmarkType.rightIndexFinger,
        PoseLandmarkType.leftThumb,
        PoseLandmarkType.rightThumb,
        PoseLandmarkType.leftHip,
        PoseLandmarkType.rightHip,
        PoseLandmarkType.leftKnee,
        PoseLandmarkType.rightKnee,
        PoseLandmarkType.leftAnkle,
        PoseLandmarkType.rightAnkle,
        PoseLandmarkType.leftHeel,
        PoseLandmarkType.rightHeel,
        PoseLandmarkType.leftToe,
        PoseLandmarkType.rightToe,
    ]
}

