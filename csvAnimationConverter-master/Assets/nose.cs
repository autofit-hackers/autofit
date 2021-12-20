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

    public int frameCount = 0;
    public int frameCountMax;
    public int loopCount = 0;
    public List<int> targetJointIndices = new List<int>() {0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28};
    public List<Dictionary<int, Joint>> deserializedFrames = new List<Dictionary<int, Joint>>();
    public List<Transform> myTransforms = new List<Transform>(33);
    // public List<int> targetJointIndices2 = new List<int>() {0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28};
    // public List<Dictionary<int, Joint>> deserializedFrames2 = new List<Dictionary<int, Joint>>();
    // public List<Transform> myTransforms2 = new List<Transform>(32);
    public float timeOut = 0.05f;
    private float timeElapsed = 0.0f;

    void Start() {
        // deserializedFramesに各行をparseして格納
        var lines = System.IO.File.ReadLines(@"./standing.json");
        foreach (string line in lines) {
            Dictionary<int, Joint> deserializedFrame = JsonConvert.DeserializeObject<Dictionary<int, Joint>>(line);
            deserializedFrames.Add(deserializedFrame);
            Debug.Log(deserializedFrame);
        }
        frameCountMax = deserializedFrames.Count;
    }

    // Update is called once per frame
    void Update()
    {
        

        Debug.Log(Time.deltaTime);
        Debug.Log(timeElapsed);
        Debug.Log(timeElapsed >= timeOut);
        //以下FPS関連
        timeElapsed += Time.deltaTime;
        //FPSを制御
        if(timeElapsed >= 0.05f) {//この中でアニメーション描画
            Dictionary<int, Joint> deserializedFrame = deserializedFrames[frameCount];

            // 各関節点の座標を取得
            // foreach(int jointIdx in targetJointIndices) {
            foreach(KeyValuePair<int, Joint> jointItem in deserializedFrame) {
                int jointIdx = jointItem.Key;
                Joint joint = jointItem.Value;
                // Joint joint = deserializedFrame[jointIdx];
                Transform myTransform = myTransforms[jointIdx];
                Vector3 pos = myTransform.position;
            
                //Debug.Log(joint.X); // , joint.Y, joint.Z);
                pos.x = joint.X / 100;
                pos.y = joint.Y / 100;
                pos.z = joint.X / 100;
                myTransform.position = pos; // 各座標に直接値を代入することはできない
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
            
            Debug.Log(timeElapsed);
            Debug.Log("I'm happy!!");

            timeElapsed = 0.0f;
        }
        
    }
}



