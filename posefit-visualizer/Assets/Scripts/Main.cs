using System.Collections.Generic;
using HumanMotionNs;
using UnityEngine;

class Main : MonoBehaviour
{
    // Start is called before the first frame update
    public Transform cylinderPrefab;
    public Transform spherePrefab;
    // public string initJsonFilePath = "./Assets/Data/init-20220119.json";
    // public string jsonFilePath1 = "./Assets/Data/squat-narrow-20220119.json";
    // public string jsonFilePath2 = "./Assets/Data/squat-wide-20220119-3.json";
    public string initJsonFilePath = "./Assets/Data/sq-1228_2.json"; // "./Assets/Data/init-20220119.json";
    public string jsonFilePath1 = "./Assets/Data/sq-1231.json";
    public string jsonFilePath2 = "./Assets/Data/sq-1228.json";
    public int startFrame1 = 750;
    public int endFrame1 = 1100;
    public int startFrame2 = 80;
    public int endFrame2 = 220;
    private Dictionary<string, BoneOrdinal> boneOrdinals;
    private HumanMotion hm1;
    private HumanMotion hm2;

    void Start()
    {
        // キャリブレーションフレームから各ボーンの長さを取得
        boneOrdinals = BoneOrdinalsNs.BoneOrdinals.JsonToBoneOrdinals(jsonFilePath: initJsonFilePath, targetFrameIdx: 160);
        foreach (KeyValuePair<string, BoneOrdinal> boneOrdinal in boneOrdinals)
        {
            Debug.Log(boneOrdinal.Key);
            Debug.Log(boneOrdinal.Value.boneLength);
        }

        hm1 = new HumanMotion(jsonFilePath: jsonFilePath1, boneOrdinals: boneOrdinals, cylinderPrefab: cylinderPrefab, spherePrefab: spherePrefab, jointColor: Color.cyan, startFrame: startFrame1, endFrame: endFrame1);
        hm2 = new HumanMotion(jsonFilePath: jsonFilePath2, boneOrdinals: boneOrdinals, cylinderPrefab: cylinderPrefab, spherePrefab: spherePrefab, jointColor: Color.magenta, startFrame: startFrame2, endFrame: endFrame2);
        hm1.ReadAndPreprocess();
        hm2.ReadAndPreprocess();
    }

    // Update is called once per frame
    void Update()
    {
        hm1.FrameStep();
        hm2.FrameStep();
    }
}
