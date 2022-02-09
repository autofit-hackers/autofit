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
    #region Variables for Humanpose
    private HumanMotion2D hm;
    public Transform cylinderPrefab;
    public Transform spherePrefab;
    public string initJsonFilePath = "./Assets/Data/init-20220119.json";
    public string jsonFilePath = "./Assets/Data/squat-narrow-20220119.json";
    public int startFrame = 125;
    public int endFrame = 207;
    private Dictionary<string, BoneOrdinal> boneOrdinals;
    #endregion

    #region Variables for Realtime Input
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
        
        hm = new HumanMotion2D(jsonFilePath: jsonFilePath, boneOrdinals: boneOrdinals, cylinderPrefab: cylinderPrefab, spherePrefab: spherePrefab, jointColor: Color.cyan, startFrame: startFrame, endFrame: endFrame);
        rm = new RealtimeMotion2D(cylinderPrefab, spherePrefab, Color.green, webCamInput, ref inputImageUI, blazePoseResource, poseLandmarkModel);
        displayObjects = new DisplayObjects(countTextObject);
        hm.ReadAndPreprocess();
        rm.Preprocess();
        displayObjects.Preprocess(mainCamera);
    }

    // Update is called once per frame
    void Update()
    {
        if (Input.GetKeyDown(KeyCode.S))
        {
            hm.CorrectTransformations(rm.state.jointGameObjects);
        }
        hm.FrameStepByJointWorldPosition(rm.state.jointGameObjects["LeftShoulder"].transform.position, "RightShoulder");
        displayObjects.Update(rm.state.jointGameObjects);
    }

    void LateUpdate()
    {
        rm.UpdateFrame(mainCamera);
    }

    void OnApplicationQuit()
    {
        rm.Dispose();
    }
}