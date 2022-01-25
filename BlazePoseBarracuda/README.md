# BlazePoseBarracuda
![demo_fitness](https://user-images.githubusercontent.com/34697515/126510967-e27a1e96-2b87-424d-988b-0e09d5929532.gif)
![demo_dance](https://user-images.githubusercontent.com/34697515/126510818-caa45abf-cfd3-443c-a0ab-af755517bfdf.gif)

**BlazePoseBarracuda** is a human 2D/3D pose estimation neural network that works with a monocular color camera.

BlazePoseBarracuda is Unity Package that runs the [Mediapipe Pose(BlazePose)](https://google.github.io/mediapipe/solutions/pose) pipeline on the [Unity](https://unity.com/).

BlazePoseBarracuda has 2 neural network models(`lite` and `full`) and, can be switched on the realtime (Check for [Mediapipe Pose(BlazePose)](https://google.github.io/mediapipe/solutions/pose) page for models detail).

BlazePoseBarracuda implementation is inspired by [HandPoseBarracuda](https://github.com/keijiro/HandPoseBarracuda) and I referenced [his](https://github.com/keijiro) source code.(Thanks, [keijiro](https://github.com/keijiro)!).

## Dependencies
BlazePoseBarracuda uses the following sub packages:
- [PoseDetectionBarracuda](https://github.com/creativeIKEP/PoseDetectionBarracuda)
- [PoseLandmarkBarracuda](https://github.com/creativeIKEP/PoseLandmarkBarracuda)

## Install
BlazePoseBarracuda can be installed from npm or GitHub URL.

### Install from npm (Recommend)
BlazePoseBarracuda can be installed by adding following sections to the manifest file (`Packages/manifest.json`).

To the `scopedRegistries` section:
```
{
  "name": "creativeikep",
  "url": "https://registry.npmjs.com",
  "scopes": [ "jp.ikep" ]
}
```
To the `dependencies` section:
```
"jp.ikep.mediapipe.blazepose": "1.1.1"
```
Finally, the manifest file looks like below:
```
{
    "scopedRegistries": [
        {
            "name": "creativeikep",
            "url": "https://registry.npmjs.com",
            "scopes": [ "jp.ikep" ]
        }
    ],
    "dependencies": {
        "jp.ikep.mediapipe.blazepose": "1.1.1",
        ...
    }
}
```

### Install from GitHub URL
BlazePoseBarracuda can be installed by adding below URLs from the Unity Package Manager's window
```
https://github.com/creativeIKEP/PoseDetectionBarracuda.git?path=Packages/PoseDetectionBarracuda#v1.0.0
```
```
https://github.com/creativeIKEP/PoseLandmarkBarracuda.git?path=Packages/PoseLandmarkBarracuda#v1.1.0
```
```
https://github.com/creativeIKEP/BlazePoseBarracuda.git?path=Packages/BlazePoseBarracuda#v1.1.1
```
or, appending lines to your manifest file(`Packages/manifest.json`) `dependencies` block.
Example is below.
```
{
  "dependencies": {
    "jp.ikep.mediapipe.posedetection": "https://github.com/creativeIKEP/PoseDetectionBarracuda.git?path=Packages/PoseDetectionBarracuda#v1.0.0",
    "jp.ikep.mediapipe.poselandmark": "https://github.com/creativeIKEP/PoseLandmarkBarracuda.git?path=Packages/PoseLandmarkBarracuda#v1.1.0",
    "jp.ikep.mediapipe.blazepose": "https://github.com/creativeIKEP/BlazePoseBarracuda.git?path=Packages/BlazePoseBarracuda#v1.1.1",
    ...
  }
}
```

## Usage Demo
Below code is the demo that estimate human pose from a image and get pose landmark.
Check ["/Assets/Script/PoseVisuallizer.cs"](/Assets/Script/PoseVisuallizer.cs) and ["/Assets/Scenes/2DSampleScene.unity"](/Assets/Scenes/2DSampleScene.unity) for BlazePoseBarracuda usage demo details in the 2D pose estimation.
Check ["/Assets/Script/PoseVisuallizer3D.cs"](/Assets/Script/PoseVisuallizer3D.cs) and ["/Assets/Scenes/3DSampleScene.unity"](/Assets/Scenes/3DSampleScene.unity) for BlazePoseBarracuda usage demo details in the 3D pose estimation.
```cs
using UnityEngine;
using Mediapipe.BlazePose;

public class <YourClassName>: MonoBehaviour
{
  // Set "Packages/BlazePoseBarracuda/ResourceSet/BlazePose.asset" on the Unity Editor.
  [SerializeField] BlazePoseResource blazePoseResource;
  // Select neural network models with pull down on the Unity Editor.
  [SerializeField] BlazePoseModel poseLandmarkModel;

  BlazePoseDetecter detecter;

  void Start(){
      detecter = new BlazePoseDetecter(blazePoseResource, poseLandmarkModel);
  }

  void Update(){
      Texture input = ...; // Your input image texture

      // Predict pose by neural network model.
      // Switchable anytime between neural network models with 2nd argment.
      detecter.ProcessImage(input, poseLandmarkModel);

      /*
      `detecter.outputBuffer` is pose landmark result and ComputeBuffer of float4 array type.
      0~32 index datas are pose landmark.
          Check below Mediapipe document about relation between index and landmark position.
          https://google.github.io/mediapipe/solutions/pose#pose-landmark-model-blazepose-ghum-3d
          Each data factors are
          x: x cordinate value of pose landmark ([0, 1]).
          y: y cordinate value of pose landmark ([0, 1]).
          z: Landmark depth with the depth at the midpoint of hips being the origin.
             The smaller the value the closer the landmark is to the camera. ([0, 1]).
             **The use of this value is not recommended. You can use `worldLandmarkBuffer` if z value is needed.**
          w: The score of whether the landmark position is visible ([0, 1]).

      33 index data is the score whether human pose is visible ([0, 1]).
      This data is (score, 0, 0, 0).
      */
      ComputeBuffer result = detecter.outputBuffer;

      /*
      `detecter.worldLandmarkBuffer` is pose world landmark result and ComputeBuffer of float4 array type.
      0~32 index datas are pose world landmark.
          Check below Mediapipe document about relation between index and landmark position.
          https://google.github.io/mediapipe/solutions/pose#pose-landmark-model-blazepose-ghum-3d
          Each data factors are
          x, y and z: Real-world 3D coordinates in meters with the origin at the center between hips.
          w: The score of whether the world landmark position is visible ([0, 1]).

      33 index data is the score whether human pose is visible ([0, 1]).
      This data is (score, 0, 0, 0).
      */
      ComputeBuffer worldLandmarkResult = detecter.worldLandmarkBuffer;

      // `detecter.vertexCount` is count of pose landmark vertices.
      // `detecter.vertexCount` returns 33.
      int count = detecter.vertexCount;

      // Your custom processing from here, i.e. rendering.
      // For example, below is CPU log debug.
      var data = new Vector4[count];
      result.GetData(data);
      Debug.Log("---");
      foreach(var d in data){
        Debug.Log(d);
      }

      worldLandmarkResult.GetData(data);
      Debug.Log("---");
      foreach(var d in data){
        Debug.Log(d);
      }
  }
}
```

## Demo Image
Videos for demo scenes(["/Assets/Scenes/2DSampleScene.unity"](/Assets/Scenes/2DSampleScene.unity) and ["/Assets/Scenes/3DSampleScene.unity"](/Assets/Scenes/3DSampleScene.unity)) was downloaded from [pixabay](https://pixabay.com).
- ["/Assets/Images/Fitness.mp4"](/Assets/Images/Fitness.mp4) was downloaded from [here](https://pixabay.com/videos/id-72464).
- ["/Assets/Images/Dance.mp4"](/Assets/Images/Dance.mp4) was downloaded from [here](https://pixabay.com/videos/id-21827).

## Author
[IKEP](https://ikep.jp)

## LICENSE
Copyright (c) 2021 IKEP

[Apache-2.0](/LICENSE.md)
