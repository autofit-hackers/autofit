using System.Collections.Generic;
using HumanMotion2DNs;
using UnityEngine;
using UnityEngine.UI;

class Main2D : MonoBehaviour
{
    // Start is called before the first frame update
    public Transform cylinderPrefab;
    public Transform spherePrefab;
    public string initJsonFilePath = "./Assets/Data/init-20220119.json";
    public string jsonFilePath1 = "./Assets/Data/squat-narrow-20220119.json";
    public int startFrame1 = 0;
    public int endFrame1 = 1000;
    private Dictionary<string, BoneOrdinal> boneOrdinals;
    private HumanMotion2D hm1;
    
    
    [SerializeField] RawImage inputImageUI;
    public Camera cam;

    void Start()
    {
        // キャリブレーションフレームから各ボーンの長さを取得
        boneOrdinals = BoneOrdinals2DNs.BoneOrdinals2D.JsonToBoneOrdinals(initJsonFilePath, 160);
        // foreach (KeyValuePair<string, BoneOrdinal> boneOrdinal in boneOrdinals)
        // {
        //     Debug.Log(boneOrdinal.Key);
        //     Debug.Log(boneOrdinal.Value.boneLength);
        // }

        hm1 = new HumanMotion2D(jsonFilePath: jsonFilePath1, boneOrdinals: boneOrdinals, cylinderPrefab: cylinderPrefab, spherePrefab: spherePrefab, jointColor: Color.cyan, startFrame: startFrame1, endFrame: endFrame1);
        hm1.ReadAndPreprocess();
        
        // cam = GetComponent<Camera>();
    }

    // Update is called once per frame
    void Update()
    {
        
        var w = inputImageUI.rectTransform.rect.width;
        var h = inputImageUI.rectTransform.rect.height;
        hm1.FrameStepByJointPosition(PoseVisuallizer.instance.keyPointVector,h,w,cam);
        // Debug.Log("main");
        // Debug.Log(PoseVisuallizer.instance.keyPointVector);
    }
}