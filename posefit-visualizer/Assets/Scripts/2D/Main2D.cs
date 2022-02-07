using System.Collections.Generic;
using HumanMotion2DNs;
using RealtimeMotion2DNs;
using UnityEngine;
using UnityEngine.UI;

class Main2D : MonoBehaviour
{
    // Start is called before the first frame update
    public Transform cylinderPrefab;
    public Transform spherePrefab;
    public string initJsonFilePath = "./Assets/Data/init-20220119.json";
    public string jsonFilePath1 = "./Assets/Data/squat-narrow-20220119.json";
    public int startFrame1 = 45;
    public int endFrame1 = 125;
    private Dictionary<string, BoneOrdinal> boneOrdinals;
    private HumanMotion2D hm1;
    private RealtimeMotion2D rm;


    [SerializeField] RawImage inputImageUI;
    public Camera cam;

    void Start()
    {
        // キャリブレーションフレームから各ボーンの長さを取得
        boneOrdinals = BoneOrdinals2DNs.BoneOrdinals2D.JsonToBoneOrdinals(initJsonFilePath, 160);
        
        hm1 = new HumanMotion2D(jsonFilePath: jsonFilePath1, boneOrdinals: boneOrdinals, cylinderPrefab: cylinderPrefab, spherePrefab: spherePrefab, jointColor: Color.cyan, startFrame: startFrame1, endFrame: endFrame1);
        hm1.ReadAndPreprocess();
        rm = new RealtimeMotion2D(cylinderPrefab, spherePrefab, Color.green);
        rm.Preprocess();
    }

    // Update is called once per frame
    void Update()
    {
        rm.UpdateFrame(PoseVisuallizer.instance.data, cam);
        // hm1.FrameStep();
        var w = inputImageUI.rectTransform.rect.width;
        var h = inputImageUI.rectTransform.rect.height;
        hm1.FrameStepByJointPosition(PoseVisuallizer.instance.keyPointVector,h,w,cam);
    }
}