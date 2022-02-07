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
    [SerializeField, Range(0, 1)] float humanExistThreshold = 0.5f;
    [SerializeField] BlazePoseModel poseLandmarkModel;

    Material material;
    BlazePoseDetecter detecter;
    
    public GameObject countTxtObj = null; // Textオブジェクト
    RepCounter repCounter;
    public AudioClip audioClip;
    private AudioSource audioSource;

    #region alignment
    public static PoseVisuallizer instance;
    #endregion

    public Vector2 keyPointVector;
    public Vector4[] data;
    
    

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

    private void Awake()
    {
        if (instance == null) instance = this;
    }


    void Start(){
        material = new Material(shader);
        detecter = new BlazePoseDetecter(blazePoseResource, poseLandmarkModel);
        repCounter = new RepCounter()
        {
            repCount = 0,
            flag = false,
            countTextObject = countTxtObj,
            isLiftUpType = false,
            upperThreshold = 0.4f,
            lowerThreshold = 0.65f,
            keyJointNumber = 16,
            menuName = "ShoulderPress"
        };
        audioSource = countTxtObj.GetComponent<AudioSource>();
        audioSource.clip = audioClip;
        data = new Vector4[33];
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.L))
        {
            audioSource.Play();
        }
    }

    void LateUpdate(){
        inputImageUI.texture = webCamInput.inputImageTexture;

        // Predict pose by neural network model.
        // Switchable anytime models with 2nd argment.
        detecter.ProcessImage(webCamInput.inputImageTexture, poseLandmarkModel);
        ComputeBuffer result = detecter.outputBuffer;
        ComputeBuffer worldLandmarkResult = detecter.worldLandmarkBuffer;

        result.GetData(data);
        
        UpdateRepCount(ref repCounter, data, audioSource);
        // Debug.Log(repCount);
        keyPointVector = new Vector2(data[11].x, data[11].y);
    } 


    void OnRenderObject(){
        /*
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
        // Graphics.DrawProceduralNow(MeshTopology.Triangles, 6, detecter.vertexCount); //ここで点を描画
        */
    }


    void OnApplicationQuit(){
        // Must call Dispose method when no longer in use.
        detecter.Dispose();
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

    struct RepCounter
    {
        public bool flag;
        public int repCount;
        public int keyJointNumber;
        public string menuName;
        public float upperThreshold;
        public float lowerThreshold;
        public GameObject countTextObject;
        public bool isLiftUpType;
    }
}
