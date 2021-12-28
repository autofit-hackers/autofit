using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using Newtonsoft.Json;


class nose : MonoBehaviour
{
    // Start is called before the first frame update
    private static int numOfJoints = 33;
    private int frameCount = 0;
    public int frameCountMax;
    private int loopCount = 0;
    public string filename;
    public int startFrame = 1;
    public int endFrame = 10;
    public float sphereScale = 0.5f;

    public Transform spherePrefab;
    public Color jointColor;
    public List<Dictionary<string, Vector3>> deserializedFrames = new List<Dictionary<string, Vector3>>();
    public List<Dictionary<string, Vector3>> jointPositions = new List<Dictionary<string, Vector3>>();
    public List<Dictionary<string, Vector3>> jointSpeeds = new List<Dictionary<string, Vector3>>();
    public Dictionary<string, GameObject> jointGameObjects = new Dictionary<string, GameObject>();
    public Dictionary<string, GameObject> boneGameObjects = new Dictionary<string, GameObject>();
    public List<Vector3> bodySpeeds = new List<Vector3>();

    public Dictionary<string, Vector3> lastFramePoses = new Dictionary<string, Vector3>();
    private float timeOut = 0.05f;
    private float timeElapsed = 0.0f;
    private float lpf_rate = 0.1f;
    public float offset1 = 0;
    public float offset2 = 0;

    public Transform cylinderPrefab;
    public List<Transform> cylinderPrefabs = new List<Transform>(3);
    public List<GameObject> cylinders = new List<GameObject>(3);
    private GameObject cylinder;

    // private string[,] boneEdgeNames = new string[,] {{"LeftShoulder", "RightShoulder"}, {"LeftShoulder", "LeftElbow"}, {"RightShoulder", "RightElbow"}};
    Dictionary<string, (string, string)> boneEdgeNames = new Dictionary<string, (string startJoint, string endJoint)>();
    void Start()
    {
        // deserializedFramesに各行をparseして格納
        var lines = System.IO.File.ReadLines(@"./" + filename);
        // var Dictionary<string, Vector3> lastJointPostion = new List<Dictionary<string, Vector3>>();
        int lineCount = 0;
        foreach (string line in lines)
        {
            Dictionary<string, Vector3> deserializedFrame = JsonConvert.DeserializeObject<Dictionary<string, Vector3>>(line);
            deserializedFrames.Add(deserializedFrame);
            // Debug.Log(deserializedFrame);

            Dictionary<string, Vector3> tmpPos = new Dictionary<string, Vector3>();
            Dictionary<string, Vector3> tmpSpd = new Dictionary<string, Vector3>();
            Vector3 bodySpd = new Vector3();
            // ローパスをかける & 瞬間速度を計算する
            foreach (KeyValuePair<string, Vector3> jointItem in deserializedFrame)
            {
                string jointName = jointItem.Key;
                Vector3 joint = jointItem.Value;

                //Joint の 中身を vector3 に格納
                Vector3 latestPosition = new Vector3();
                latestPosition.x = (joint.y - 165.2f) / 100;
                latestPosition.y = -((joint.x - 250f) / 100);
                latestPosition.z = joint.z / 100;
                if (lineCount == 0) { lastFramePoses.Add(jointName, latestPosition); } // 1ループ目の時はdicに要素を追加
                // LPF
                Vector3 lowpassFilteredPosition = new Vector3();
                lowpassFilteredPosition = lastFramePoses[jointName] * lpf_rate + latestPosition * (1 - lpf_rate); // ローパス後のposを計算
                Vector3 jointSpeed = lowpassFilteredPosition - lastFramePoses[jointName];
                lastFramePoses[jointName] = lowpassFilteredPosition;
                tmpPos.Add(jointName, lowpassFilteredPosition);
                tmpSpd.Add(jointName, jointSpeed);
                bodySpd += jointSpeed;
                if (jointName == "Nose")
                {
                    // Debug.Log(lowpassFilteredPosition);
                }
            }
            jointPositions.Add(tmpPos); // JointPos=Dic<string,Vector3>()にローパス済みのposをAdd
            jointSpeeds.Add(tmpSpd);
            bodySpeeds.Add(bodySpd);
            Debug.Log("bodySpeed "+bodySpd);

            //キーフレーム抽出
            // if (lineCount > 0)
            // {
            //     
            // }
            lineCount += 1;

        }
        // foreach (var jointPosition in jointPositions)
        // {
        //     foreach (KeyValuePair<string, Vector3> kvp in jointPosition)
        //     {
        //         if (kvp.Key == "Nose")
        //         {
        //             Debug.Log("" + kvp.Key + kvp.Value);
        //         }
        //     }
        // }
        frameCountMax = deserializedFrames.Count;
        if (frameCountMax <= endFrame) { endFrame = frameCountMax - 1; } //frameCountMaxがendFrameを超えてしまわないようにする

        var slicedFrames = endFrame - startFrame;
        // [startFrame:endFrame] をスライス
        // TODO: update内で処理する
        deserializedFrames = deserializedFrames.GetRange(startFrame, slicedFrames);
        frameCountMax = deserializedFrames.Count;

        // Initialize joint objects
        // NOTE: get joint names from 0 frame of deserializedFrames
        foreach (var jointName in deserializedFrames[0].Keys)
        {
            jointGameObjects[jointName] = Instantiate<GameObject>(spherePrefab.gameObject, Vector3.zero, Quaternion.identity);
            jointGameObjects[jointName].transform.localScale = new Vector3(sphereScale, sphereScale, sphereScale);
            jointGameObjects[jointName].GetComponent<Renderer>().material.color = jointColor;
        }

        // Initialize bone names
        boneEdgeNames.Add("Shoulders", ("LeftShoulder", "RightShoulder"));
        boneEdgeNames.Add("LeftUpperArm", ("LeftShoulder", "LeftElbow"));
        boneEdgeNames.Add("RightUpperArm", ("RightShoulder", "RightElbow"));
        boneEdgeNames.Add("LeftForeArm", ("LeftElbow", "LeftWrist"));
        boneEdgeNames.Add("RightForeArm", ("RightElbow", "RightWrist"));
        boneEdgeNames.Add("LeftFlank", ("LeftShoulder", "LeftHip"));
        boneEdgeNames.Add("RightFlank", ("RightShoulder", "RightHip"));
        boneEdgeNames.Add("Pelvis", ("LeftHip", "RightHip"));
        boneEdgeNames.Add("LeftThigh", ("LeftHip", "LeftKnee"));
        boneEdgeNames.Add("RightTigh", ("RightHip", "RightKnee"));
        boneEdgeNames.Add("LeftShin", ("LeftKnee", "LeftAnkle"));
        boneEdgeNames.Add("RightShin", ("RightKnee", "RightAnkle"));

        //Initialize bone objects
        foreach (KeyValuePair<string, (string, string)> boneEdgeName in boneEdgeNames)
        {
            string boneName = boneEdgeName.Key;
            // Debug.Log(boneKey);
            string startJointName = boneEdgeName.Value.Item1;
            string endJointName = boneEdgeName.Value.Item2;
            InstantiateCylinder(
                boneName,
                cylinderPrefab,
                jointGameObjects[startJointName].transform.position,
                jointGameObjects[endJointName].transform.position
                );
            boneGameObjects[boneName].GetComponent<Renderer>().material.color = jointColor;
        }
    }

    // Update is called once per frame
    void Update()
    {
        //以下FPS関連
        timeElapsed += Time.deltaTime;
        //FPSを制御
        if (timeElapsed >= timeOut)
        {//この中でアニメーション描画
            // Dictionary<string, Joint> deserializedFrame = deserializedFrames[frameCount];
            Dictionary<string, Vector3> jointFrame = jointPositions[frameCount];

            // 各関節点の座標を取得
            foreach (KeyValuePair<string, Vector3> jointPosition in jointFrame)
            {
                string jointName = jointPosition.Key;
                // Joint joint = jointPostion.Value;
                Vector3 pos = jointPosition.Value;

                // if (frameCount == 0 && loopCount == 0) { // lastFarme の初期化
                //     lastFramePoses.Add(jointName, jointTransform.position);
                // }
                //
                // Vector3 pos = jointTransform.position;
                //
                // pos.x = (joint.Y - 165.2f) / 100 + offset1;
                // pos.y = -((joint.X - 250f) / 100) + offset2;
                // pos.z = joint.Z / 100;

                // LPF
                // pos = lastFramePoses[jointName] * lpf_rate + pos * (1 - lpf_rate);
                // jointGameObjects[jointName].transform.position = pos; // 各座標に直接値を代入することはできない
                // lastFramePoses[jointName] = pos;
                jointGameObjects[jointName].transform.position = pos;
                if (jointName == "Nose")
                {
                    // Debug.Log(pos);
                }
                // Debug.Log(jointName);
            }
            //ここでcylのupdate
            foreach (KeyValuePair<string, (string, string)> boneEdgeName in boneEdgeNames)
            {
                string boneName = boneEdgeName.Key;
                string startJointName = boneEdgeName.Value.Item1;
                string endJointName = boneEdgeName.Value.Item2;
                // Debug.Log(boneName);
                // Debug.Log(jointGameObjects[startJointName].transform.position);
                // Debug.Log(startJointName);
                UpdateCylinderPosition(
                    boneGameObjects[boneName],
                    jointGameObjects[startJointName].transform.position,
                    jointGameObjects[endJointName].transform.position
                    );
            }

            // カウンタをインクリメント
            frameCount += 1;

            // 最終フレームに到達した時の処理
            if (frameCount == frameCountMax)
            {
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
    private void InstantiateCylinder(String key, Transform cylinderPrefab, Vector3 beginPoint, Vector3 endPoint)
    {
        boneGameObjects[key] = Instantiate<GameObject>(cylinderPrefab.gameObject, Vector3.zero, Quaternion.identity);
        UpdateCylinderPosition(boneGameObjects[key], beginPoint, endPoint);
    }

    private void UpdateCylinderPosition(GameObject cyl, Vector3 beginPoint, Vector3 endPoint)
    {
        Vector3 offset = endPoint - beginPoint;
        Vector3 position = beginPoint + (offset / 2.0f);

        cyl.transform.position = position;
        cyl.transform.LookAt(beginPoint);
        Vector3 localScale = cyl.transform.localScale;
        localScale.z = (endPoint - beginPoint).magnitude;
        cyl.transform.localScale = localScale;
    }
}