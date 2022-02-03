using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using Mediapipe.BlazePose;

public class PoseVisuallizer : MonoBehaviour
{
    [SerializeField] WebCamInput webCamInput;
    [SerializeField] RawImage inputImageUI;
    [SerializeField] Shader shader;
    [SerializeField] BlazePoseResource blazePoseResource;
    [SerializeField, Range(0, 1)] float humanExistThreshold = 0.5f;
    [SerializeField] BlazePoseModel poseLandmarkModel;

    Material material;
    BlazePoseDetecter detecter;
    private int flag = 0;
    private int repCount = 0;

    // Lines count of body's topology.
    const int BODY_LINE_NUM = 35;
    // Pairs of vertex indices of the lines that make up body's topology.
    // Defined by the figure in https://google.github.io/mediapipe/solutions/pose.
    readonly List<Vector4> linePair = new List<Vector4>{
        new Vector4(0, 1), new Vector4(1, 2), new Vector4(2, 3), new Vector4(3, 7), new Vector4(0, 4), 
        new Vector4(4, 5), new Vector4(5, 6), new Vector4(6, 8), new Vector4(9, 10), new Vector4(11, 12), 
        new Vector4(11, 13), new Vector4(13, 15), new Vector4(15, 17), new Vector4(17, 19), new Vector4(19, 15), 
        new Vector4(15, 21), new Vector4(12, 14), new Vector4(14, 16), new Vector4(16, 18), new Vector4(18, 20), 
        new Vector4(20, 16), new Vector4(16, 22), new Vector4(11, 23), new Vector4(12, 24), new Vector4(23, 24), 
        new Vector4(23, 25), new Vector4(25, 27), new Vector4(27, 29), new Vector4(29, 31), new Vector4(31, 27), 
        new Vector4(24, 26), new Vector4(26, 28), new Vector4(28, 30), new Vector4(30, 32), new Vector4(32, 28)
    };


    void Start(){
        material = new Material(shader);
        detecter = new BlazePoseDetecter(blazePoseResource, poseLandmarkModel);
    }

//      void LateUpdate()
//      {
//          Texture input = webCamInput.inputImageTexture; // Your input image texture
//
//        // Predict pose by neural network model.
//        // Switchable anytime between neural network models with 2nd argment.
//        detecter.ProcessImage(input, poseLandmarkModel);
//
//        /*
//        `detecter.outputBuffer` is pose landmark result and ComputeBuffer of float4 array type.
//        0~32 index datas are pose landmark.
//            Check below Mediapipe document about relation between index and landmark position.
//            https://google.github.io/mediapipe/solutions/pose#pose-landmark-model-blazepose-ghum-3d
//            Each data factors are
//            x: x cordinate value of pose landmark ([0, 1]).
//            y: y cordinate value of pose landmark ([0, 1]).
//            z: Landmark depth with the depth at the midpoint of hips being the origin.
//               The smaller the value the closer the landmark is to the camera. ([0, 1]).
//               **The use of this value is not recommended. You can use `worldLandmarkBuffer` if z value is needed.**
//            w: The score of whether the landmark position is visible ([0, 1]).
//
//        33 index data is the score whether human pose is visible ([0, 1]).
//        This data is (score, 0, 0, 0).
//        */
//        ComputeBuffer result = detecter.outputBuffer;
//
//        /*
//        `detecter.worldLandmarkBuffer` is pose world landmark result and ComputeBuffer of float4 array type.
//        0~32 index datas are pose world landmark.
//            Check below Mediapipe document about relation between index and landmark position.
//            https://google.github.io/mediapipe/solutions/pose#pose-landmark-model-blazepose-ghum-3d
//            Each data factors are
//            x, y and z: Real-world 3D coordinates in meters with the origin at the center between hips.
//            w: The score of whether the world landmark position is visible ([0, 1]).
//
//        33 index data is the score whether human pose is visible ([0, 1]).
//        This data is (score, 0, 0, 0).
//        */
//        ComputeBuffer worldLandmarkResult = detecter.worldLandmarkBuffer;
//
//        // `detecter.vertexCount` is count of pose landmark vertices.
//        // `detecter.vertexCount` returns 33.
//        int count = detecter.vertexCount;
//
//        // Your custom processing from here, i.e. rendering.
//        // For example, below is CPU log debug.
//        var data = new Vector4[count];
//        result.GetData(data);
//        Debug.Log("---");
//        foreach(var d in data){
//          Debug.Log(d);
//        }
//
//        worldLandmarkResult.GetData(data);
//        Debug.Log("---");
//        foreach(var d in data){
//          Debug.Log(d);
//        }
//      }

    void LateUpdate(){
        inputImageUI.texture = webCamInput.inputImageTexture;

        // Predict pose by neural network model.
        // Switchable anytime models with 2nd argment.
        detecter.ProcessImage(webCamInput.inputImageTexture, poseLandmarkModel);
        ComputeBuffer result = detecter.outputBuffer;
        ComputeBuffer worldLandmarkResult = detecter.worldLandmarkBuffer;
        
        int count = detecter.vertexCount;
        var data = new Vector4[count];
        result.GetData(data);
        if (flag == 0 && data[16].y < 0.4) flag = 1;
        if (flag == 1 && data[16].y > 0.7)
        {
            flag = 0;
            repCount += 1;
        }
        Debug.Log(repCount);
        
        // foreach(var d in data){
        //     Debug.Log(d);
        // }

        // worldLandmarkResult.GetData(data);
        // Debug.Log("---");
        // foreach(var d in data){
        //     Debug.Log(d);
        // }
    } 


    void OnRenderObject(){
        var w = inputImageUI.rectTransform.rect.width;
        var h = inputImageUI.rectTransform.rect.height;

        // Set predicted pose landmark results.
        material.SetBuffer("_vertices", detecter.outputBuffer);
        // Set pose landmark counts.
        material.SetInt("_keypointCount", detecter.vertexCount);
        material.SetFloat("_humanExistThreshold", humanExistThreshold);
        material.SetVector("_uiScale", new Vector2(w, h));
        material.SetVectorArray("_linePair", linePair);

        // Draw 35 body topology lines.
        material.SetPass(0);
        Graphics.DrawProceduralNow(MeshTopology.Triangles, 6, BODY_LINE_NUM); //ここで線を描画

        // Draw 33 landmark points.
        material.SetPass(1);
        Graphics.DrawProceduralNow(MeshTopology.Triangles, 6, detecter.vertexCount); //ここで点を描画
    }

    void OnApplicationQuit(){
        // Must call Dispose method when no longer in use.
        detecter.Dispose();
    }
}
