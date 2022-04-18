using System;
using System.Collections.Generic;
using HumanMotion2DNs;
using RealtimeMotion2DNs;
using DisplayObjects2DNs;
using UnityEngine;
using UnityEngine.UI;
using Mediapipe.BlazePose;

class Main2D : MonoBehaviour
{
    #region Variables for TrainerPose
    private HumanMotion2D hm;
    public Transform cylinderPrefab;
    public Transform spherePrefab;
    public string initJsonFilePath = "./Assets/Data/init-20220119.json";
    public string jsonFilePath = "./Assets/Data/squat-narrow-20220119.json";
    public int startFrame = 125;
    public int endFrame = 207;
    private Dictionary<string, BoneOrdinal> boneOrdinals;
    #endregion

    #region Variables for TraineePose
    private RealtimeMotion2D rm;
    public Camera mainCamera;
    [SerializeField] WebCamInput webCamInput;
    [SerializeField] RawImage inputImageUI;
    [SerializeField] BlazePoseResource blazePoseResource;
    [SerializeField] BlazePoseModel poseLandmarkModel;
    #endregion

    #region Valiables for Display Objects
    private DisplayObjects displayObjects;
    public GameObject countTextObject; // Textオブジェクト
    #endregion


    void Start()
    {
        // キャリブレーションフレームから各ボーンの長さを取得
        boneOrdinals = BoneOrdinals2DNs.BoneOrdinals2D.JsonToBoneOrdinals(initJsonFilePath, 160);
        
        // トレーナー初期化
        hm = new HumanMotion2D(jsonFilePath: jsonFilePath, boneOrdinals: boneOrdinals, cylinderPrefab: cylinderPrefab, spherePrefab: spherePrefab, jointColor: Color.cyan, startFrame: startFrame, endFrame: endFrame);
        hm.ReadAndPreprocess();
        
        // トレーニー初期化
        rm = new RealtimeMotion2D(cylinderPrefab, spherePrefab, Color.green, webCamInput, ref inputImageUI, blazePoseResource, poseLandmarkModel);
        rm.Preprocess();

        // 表示系初期化
        displayObjects = new DisplayObjects(countTextObject);
        displayObjects.Preprocess(mainCamera);
    }

    // Update is called once per frame
    void Update()
    {
        // スタートトリガでの処理
        if (Input.GetKeyDown(KeyCode.S))
        {
            // 重ね合わせ
            hm.CorrectTransformations(rm.state.jointGameObjects);
            
            // TODO: カウント系のRepリセットはここにかく
            displayObjects.ResetRepCounts();
        }
        
        // トレーナーのフレームを進める
        hm.FrameStepByJointWorldPosition(rm.state.jointGameObjects["LeftShoulder"].transform.position, "RightShoulder");
        
        // 表示系の更新
        displayObjects.Update(rm.state.jointGameObjects);
    }

    void LateUpdate()
    {
        // トレーニーの更新
        rm.UpdateFrame(mainCamera);
    }

    void OnApplicationQuit()
    {
        rm.Dispose();
    }
}