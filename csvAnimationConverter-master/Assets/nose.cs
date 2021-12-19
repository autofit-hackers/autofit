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
    public List<Dictionary<int, Joint>> deserializedFrames = new List<Dictionary<int, Joint>>();
    public Transform myTransform;

    void Start() {
        // deserializedFramesに各行をparseして格納
        var lines = System.IO.File.ReadLines(@"./jointFrames.txt");
        foreach (string line in lines) {
            // Debug.Log(frame);
            Dictionary<int, Joint> deserializedFrame = JsonConvert.DeserializeObject<Dictionary<int, Joint>>(line);
            deserializedFrames.Add(deserializedFrame);
        }
        frameCountMax = deserializedFrames.Count;
    }

    // Update is called once per frame
    void Update()
    {
        Vector3 pos = myTransform.position;
        Dictionary<int, Joint> deserializedFrame = deserializedFrames[frameCount];

        // 各関節点の座標を取得
        foreach(KeyValuePair<int, Joint> jointItem in deserializedFrame) {
            int jointIdx = jointItem.Key;
            Joint joint = jointItem.Value;

            // typeof
            Debug.Log(joint.X); // , joint.Y, joint.Z);
            pos.x = joint.X / 100;
            pos.y = joint.Y / 100;
            pos.z = joint.X / 100;
            myTransform.position = pos;
        }

        // var a = 0;
        // pos.x = deserializedFrame.a.X;
        // pos.y = deserializedFrame.a.Y;
        // pos.z = deserializedFrame.a.Z;
        // カウンタをインクリメント
        frameCount += 1;

        if (frameCount == frameCountMax) {
            Debug.Log(frameCount);
            Debug.Log(frameCountMax);
            // UnityEngine.Application.Quit(); // 本番環境（スタンドアロン）で実行している場合
            UnityEditor.EditorApplication.isPlaying = false; //開発環境
        }
    }
}



