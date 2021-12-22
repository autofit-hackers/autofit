using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using Newtonsoft.Json;
// using System.Text.Json;
// using System.Text.Json.Serialization;
// using System.Web.Script;
// .Serialization;
// unko

class Joint
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }
}

class nose : MonoBehaviour
{
    // Start is called before the first frame update
    private static int numOfJoints = 33;
    public int frameCount = 0;
    public int frameCountMax;
    public int loopCount = 0;
    public string filename;
    public int startFrame = 1;
    public int endFrame = 10;

    public List<Dictionary<string, Joint>> deserializedFrames = new List<Dictionary<string, Joint>>();
    // public List<Transform> myTransforms = new List<Transform>(33);
    public Dictionary<string,Transform> jointTransforms = new Dictionary<string,Transform>();

    // public List<int> targetJointIndices2 = new List<int>() {0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28};
    // public List<Dictionary<int, Joint>> deserializedFrames2 = new List<Dictionary<int, Joint>>();
    // public List<Transform> myTransforms2 = new List<Transform>(32);
    public Dictionary<string,Vector3> lastFramePoses = new Dictionary<string,Vector3>();
    public float timeOut = 0.05f;
    private float timeElapsed = 0.0f;
    private float lpf_rate = 0.001f;
    public float offset1 = 0;
    public float offset2 = 0;
    
    public Transform cylinderPrefab;
    public List<Transform> cylinderPrefabs = new List<Transform>(11);
    private GameObject cylinder;

    void Start() {
        // deserializedFramesに各行をparseして格納
        var lines = System.IO.File.ReadLines(@"./" + filename);
        foreach (string line in lines) {
            Dictionary<string, Joint> deserializedFrame = JsonConvert.DeserializeObject<Dictionary<string, Joint>>(line);
            deserializedFrames.Add(deserializedFrame);
            Debug.Log(deserializedFrame);
        }
        frameCountMax = deserializedFrames.Count;
        if  (frameCountMax <= endFrame) {
            endFrame = frameCountMax - 1;
        } 
        var slicedFrames = endFrame - startFrame;
        // [startFrame:endFrame] をスライス
        // TODO: update内で処理する
        deserializedFrames = deserializedFrames.GetRange(startFrame, slicedFrames);
        frameCountMax = deserializedFrames.Count;
        Debug.Log("numOfJoints");
        Debug.Log(numOfJoints);
        
        // foreach (var cylinderPrefab in cylinderPrefabs)
        // {
        //     InstantiateCylinder(cylinderPrefab, new Vector3(-1, 0, 0), new Vector3(1, 0, 0));
        // }
    }

    // Update is called once per frame
    void Update()
    {

        //以下FPS関連
        timeElapsed += Time.deltaTime;
        //FPSを制御
        if(timeElapsed >= 0.05f) {//この中でアニメーション描画
            Dictionary<string, Joint> deserializedFrame = deserializedFrames[frameCount];

            // 各関節点の座標を取得
            foreach(KeyValuePair<string, Joint> jointItem in deserializedFrame) {
                string jointName = jointItem.Key;
                Joint joint = jointItem.Value;
                // Joint joint = deserializedFrame[jointIdx];
                // XXX: ?
                Transform jointTransform = jointTransforms[jointName];
                // Transform myTransform = myTransforms[jointIdx];

                if (frameCount == 0){
                    // Debug.Log("ここだぜ");
                    lastFramePoses.Add(jointName,jointTransform.position);
                }
                
                // Vector3 pos = jointTransform.position;
                Vector3 pos = jointTransform.position;

                //Debug.Log(joint.X); // , joint.Y, joint.Z);
                pos.x = (joint.Y - 165.2f) / 100 + offset1;
                pos.y = -((joint.X - 250f) / 100) + offset2;
                pos.z = joint.Z / 100;

                // LPF
                pos = lastFramePoses[jointName] * lpf_rate + pos * (1 - lpf_rate);
                jointTransform.position = pos; // 各座標に直接値を代入することはできない
                lastFramePoses[jointName] = pos;

                // foreach (var cylinderPrefab in cylinderPrefabs)
                // {
                //     UpdateCylinderPosition(cylinderPrefab, jointTransforms[i].position, jointTransforms[i+1].position);
                // }
            }

            // カウンタをインクリメント
            frameCount += 1;

            // 最終フレームに到達した時の処理
            if (frameCount == frameCountMax) {
                frameCount = 0;
                loopCount += 1;
                if (loopCount == 100)
                {
                    UnityEditor.EditorApplication.isPlaying = false; //開発環境での停止トリガ
                    // UnityEngine.Application.Quit(); // 本番環境（スタンドアロン）で実行している場合
                } 
            }            
            

            timeElapsed = 0.0f;
        }
    }
    private void InstantiateCylinder(Transform cylinderPrefab, Vector3 beginPoint, Vector3 endPoint)
    {
        cylinder = Instantiate<GameObject>(cylinderPrefab.gameObject, Vector3.zero, Quaternion.identity);
        UpdateCylinderPosition(cylinder, beginPoint, endPoint);
    }

    private void UpdateCylinderPosition(GameObject cylinder, Vector3 beginPoint, Vector3 endPoint)
    {
        Vector3 offset = endPoint - beginPoint;
        Vector3 position = beginPoint + (offset / 2.0f);

        cylinder.transform.position = position;
        cylinder.transform.LookAt(beginPoint);
        Vector3 localScale = cylinder.transform.localScale;
        localScale.z = (endPoint - beginPoint).magnitude;
        cylinder.transform.localScale = localScale;
    }
}




/*
nose
1~156
nose2
18~173
*/