using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using Mediapipe.BlazePose;
using OpenCVForUnity.ArucoModule;
using HumanMotion2DNs;

public class PoseVisuallizer : MonoBehaviour
{
    [SerializeField] WebCamInput webCamInput;
    [SerializeField] RawImage inputImageUI;
    [SerializeField] Shader shader;
    [SerializeField] BlazePoseResource blazePoseResource;
    //[SerializeField, Range(0, 1)] float humanExistThreshold = 0.5f;
    [SerializeField] BlazePoseModel poseLandmarkModel;

    // Material material;
    BlazePoseDetecter detector;
    
    public GameObject countTxtObj = null; // repCounter に対応するTextオブジェクト
    RepCounter repCounter;
    public AudioClip audioClip;
    private AudioSource audioSource;

    private KeywordController keywordController; // 音声認識
    public GameObject menuNameTxtObj = null;

    #region alignment
    public static PoseVisuallizer instance;
    #endregion

    public Vector2 keyPointVector;
    public Vector4[] data;
    public Camera mainCamera;

    
    private void Awake()
    {
        if (instance == null) instance = this;
    }


    void Start(){
        // material = new Material(shader);
        detector = new BlazePoseDetecter(blazePoseResource, poseLandmarkModel);
        repCounter = new RepCounter()
        {
            repCount = 0,
            flag = false,
            countTextObject = countTxtObj,
            isLiftUpType = false,
            upperThreshold = 0.4f,
            lowerThreshold = 0.65f,
            keyJointNumber = 16,
            menuNameTextObject = menuNameTxtObj
        };
        audioSource = countTxtObj.GetComponent<AudioSource>();
        audioSource.clip = audioClip;
        
        // 音声認識
        string[][] keywords = new string[][]
        {
            new string[] {"すくわっと"}, //ひらがなでもカタカナでもいい
            new string[] {"しょるだーぷれす"},
            new string[] {"すたーと"}
        };
        keywordController = new KeywordController(keywords, true);
        keywordController.SetKeywords();
        keywordController.StartRecognizing(0);
        keywordController.StartRecognizing(1);
        keywordController.StartRecognizing(2);
        
        data = new Vector4[33];
        countTxtObj.transform.position = mainCamera.ScreenToWorldPoint(new Vector3(100, 980, 100)) + new Vector3(0,-5,0);
        menuNameTxtObj.transform.position = mainCamera.ScreenToWorldPoint(new Vector3(100, 980, 100)) + new Vector3(0,-5,0);
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.L))
        {
            audioSource.Play();
        }
        if (Input.GetKeyDown(KeyCode.C) ^ keywordController.hasRecognized[2]) // スタート
        {
            countTxtObj.transform.position = mainCamera.ScreenToWorldPoint(new Vector3(200, 1720, 100)) + new Vector3(0,-5,0);
            repCounter.repCount = 0;
            repCounter.countTextObject.GetComponent<Text>().text = repCounter.repCount.ToString();
            // TODO: 位置合わせ

        }
        if (keywordController.hasRecognized[0]) // 種目選択
        {
            repCounter.menuNameTextObject.GetComponent<Text>().text = "スクワット";
        }
        if (keywordController.hasRecognized[1])
        {
            repCounter.menuNameTextObject.GetComponent<Text>().text = "ショルダープレス";
        }
    }

    void LateUpdate(){
        inputImageUI.texture = webCamInput.inputImageTexture;

        // Predict pose by neural network model.
        // Switchable anytime models with 2nd argment.
        detector.ProcessImage(webCamInput.inputImageTexture, poseLandmarkModel);
        ComputeBuffer result = detector.outputBuffer;
        ComputeBuffer worldLandmarkResult = detector.worldLandmarkBuffer;

        result.GetData(data);
        
        UpdateRepCountX(ref repCounter, data, audioSource);
        // Debug.Log(repCount);
        keyPointVector = new Vector2(data[11].y, data[11].x);
    }
    
    void OnApplicationQuit(){
        // Must call Dispose method when no longer in use.
        detector.Dispose();
    }

    void UpdateRepCount(ref RepCounter repCounter, Vector4[] data, AudioSource audioSource)
    {
        if (repCounter.isLiftUpType)
        {
            if (!repCounter.flag && data[repCounter.keyJointNumber].y < repCounter.upperThreshold)
                repCounter.flag = true;
            if (repCounter.flag && data[repCounter.keyJointNumber].y > repCounter.lowerThreshold)
            {
                repCounter.flag = false;
                repCounter.repCount++;
                repCounter.countTextObject.GetComponent<Text>().text = repCounter.repCount.ToString();
                // audioSource.Play();
            }
        }
        else
        {
            if (!repCounter.flag && data[repCounter.keyJointNumber].y > repCounter.lowerThreshold)
                repCounter.flag = true;
            if (repCounter.flag && data[repCounter.keyJointNumber].y < repCounter.upperThreshold)
            {
                repCounter.flag = false;
                repCounter.repCount++;
                repCounter.countTextObject.GetComponent<Text>().text = repCounter.repCount.ToString();
                // audioSource.Play();
            }
        }
    }
    
    void UpdateRepCountX(ref RepCounter repCounter, Vector4[] data, AudioSource audioSource)
    {
        if (repCounter.isLiftUpType)
        {
            if (!repCounter.flag && data[repCounter.keyJointNumber].x < repCounter.upperThreshold)
                repCounter.flag = true;
            if (repCounter.flag && data[repCounter.keyJointNumber].x > repCounter.lowerThreshold)
            {
                repCounter.flag = false;
                repCounter.repCount++;
                repCounter.countTextObject.GetComponent<Text>().text = repCounter.repCount.ToString();
                // audioSource.Play();
            }
        }
        else
        {
            if (!repCounter.flag && data[repCounter.keyJointNumber].x > repCounter.lowerThreshold)
                repCounter.flag = true;
            if (repCounter.flag && data[repCounter.keyJointNumber].x < repCounter.upperThreshold)
            {
                repCounter.flag = false;
                repCounter.repCount++;
                repCounter.countTextObject.GetComponent<Text>().text = repCounter.repCount.ToString();
                // audioSource.Play();
            }
        }
    }

    struct RepCounter
    {
        public bool flag;
        public int repCount;
        public int keyJointNumber;
        public GameObject menuNameTextObject;
        public float upperThreshold;
        public float lowerThreshold;
        public GameObject countTextObject;
        public bool isLiftUpType;
    }
}
