using System;
using System.Collections.Generic;
using UnityEngine;

using Newtonsoft.Json;

class Main : MonoBehaviour
{
    // Start is called before the first frame update
    private static int numOfJoints = 33;
    public int frameCount = 0;
    public int frameCountMax;
    private int loopCount = 0;
    public string filename = "Assets/Data/sq-1231.json";
    public int startFrame = 750;
    public int endFrame = 1100;
    public float sphereScale = 0.1f;

    public Transform spherePrefab;
    public Color jointColor;
    public List<Dictionary<string, Vector3>> deserializedFrames = new List<Dictionary<string, Vector3>>();
    public List<Dictionary<string, Vector3>> jointPositions = new List<Dictionary<string, Vector3>>();
    public List<Dictionary<string, Vector3>> jointSpeeds = new List<Dictionary<string, Vector3>>();
    public Dictionary<string, GameObject> jointGameObjects = new Dictionary<string, GameObject>();
    public Dictionary<string, GameObject> boneGameObjects = new Dictionary<string, GameObject>();
    public List<Vector3> bodySpeeds = new List<Vector3>();
    private Vector3 startPosition = new Vector3();
    private List<int> keyFrames = new List<Int32>();
    private int recognizeAsTheSame = 10;

    public Dictionary<string, Vector3> lastFramePoses = new Dictionary<string, Vector3>();
    private float timeOut = 0.05f;
    private float timeElapsed = 0.0f;
    private float lpf_rate = 0.2f;
    public float offset1 = 0;
    public float offset2 = 0;

    public Transform cylinderPrefab;
    public List<Transform> cylinderPrefabs = new List<Transform>(3);
    public List<GameObject> cylinders = new List<GameObject>(3);
    private GameObject cylinder;
    
    Dictionary<string, (string, string)> boneEdgeNames = new Dictionary<string, (string startJoint, string endJoint)>();

    private Dictionary<string, BoneOrdinal> boneOrdinals = new Dictionary<string, BoneOrdinal>();
    private Dictionary<string, Vector3> basePose = new Dictionary<string, Vector3>();
    public List<Dictionary<string, Vector3>> zCalibratedJointPositions = new List<Dictionary<string, Vector3>>();
    public Dictionary<string, GameObject> calibratedJointGameObjects = new Dictionary<string, GameObject>();
    public Dictionary<string, GameObject> calibratedBoneGameObjects = new Dictionary<string, GameObject>();
    
    private List<(int, string)> ngJoints = new List<(int, string)>();
    
    // Visualize rigid alignment
    public List<Dictionary<string, Vector3>> jointPositionsDisturbed = new List<Dictionary<string, Vector3>>();
    public Dictionary<string, GameObject> jointGameObjectsDisturbed = new Dictionary<string, GameObject>();
    public Dictionary<string, GameObject> boneGameObjectsDisturbed = new Dictionary<string, GameObject>();
    public List<Dictionary<string, Vector3>> jointPositionsAligned = new List<Dictionary<string, Vector3>>();
    public Dictionary<string, GameObject> jointGameObjectsAligned = new Dictionary<string, GameObject>();
    public Dictionary<string, GameObject> boneGameObjectsAligned = new Dictionary<string, GameObject>();

    void Start()
    {
        // deserializedFramesに各行をparseして格納
        var lines = System.IO.File.ReadLines(@"./" + filename);
        int lineCount = 0;
        foreach (string line in lines)
        {
            Dictionary<string, Vector3> deserializedFrame =
                JsonConvert.DeserializeObject<Dictionary<string, Vector3>>(line);
            deserializedFrames.Add(deserializedFrame);

            Dictionary<string, Vector3> tmpPos = new Dictionary<string, Vector3>();
            Dictionary<string, Vector3> tmpSpd = new Dictionary<string, Vector3>();
            Vector3 bodySpd = new Vector3();
            Vector3 bodyPos = new Vector3();

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
                if (lineCount == 0)
                {
                    lastFramePoses.Add(jointName, latestPosition);
                } // 1ループ目の時はdicに要素を追加

                // LPF
                Vector3 lowpassFilteredPosition = new Vector3();
                lowpassFilteredPosition =
                    lastFramePoses[jointName] * lpf_rate + latestPosition * (1 - lpf_rate); // ローパス後のposを計算
                Vector3 jointSpeed = lowpassFilteredPosition - lastFramePoses[jointName];
                lastFramePoses[jointName] = lowpassFilteredPosition;

                // TmpDicに関節のposition情報を格納
                tmpPos.Add(jointName, lowpassFilteredPosition);
                tmpSpd.Add(jointName, jointSpeed);

                // キーフレーム抽出用に重心の算出
                bodySpd += jointSpeed;
                bodyPos += lowpassFilteredPosition;
            }

            jointPositions.Add(tmpPos); // JointPos=Dic<string,Vector3>()にローパス済みのposをAdd
            jointSpeeds.Add(tmpSpd);
            bodySpeeds.Add(bodySpd);
            if (lineCount == startFrame)
            {
                startPosition = bodyPos;　//最初のフレームにおいて重心の初期位置を定義
            } 

            float bodyVel = Mathf.Sqrt(bodySpd.x * bodySpd.x + bodySpd.y * bodySpd.y + bodySpd.z * bodySpd.z);

            // キーフレーム抽出
            if (lineCount > startFrame && lineCount < endFrame)
            {
                if (bodyVel < 0.5 && Vector3.Angle(startPosition, bodyPos) < 20)
                {
                    keyFrames.Add(lineCount);
                    DeleteSameKeyFrames(keyFrames, lineCount, recognizeAsTheSame);
                    Debug.Log("frameNumber -> " + lineCount + ", angle -> ");
                    Debug.Log(Vector3.Angle(startPosition, bodyPos));
                }

                Debug.Log("frameNumber -> " + lineCount + ", bodySpeed -> " + bodySpd + ", bodyVel -> " + bodyVel);
            }
            
            // z軸補正のための基準フレーム抽出
            if (lineCount == 160)
            {
                basePose = tmpPos;
            }

            lineCount += 1;
        }

        // 最終フレームの定義
        frameCountMax = deserializedFrames.Count;
        if (frameCountMax <= endFrame)
        {
            endFrame = frameCountMax - 1;　//frameCountMaxがendFrameを超えてしまわないようにする
        } 

        var slicedFrames = endFrame - startFrame;
        // [startFrame:endFrame] をスライス
        // TODO: update内で処理する
        deserializedFrames = deserializedFrames.GetRange(startFrame, slicedFrames);
        frameCountMax = deserializedFrames.Count;

        // Initialize joint objects
        // NOTE: get joint names from 0 frame of deserializedFrames
        foreach (var jointName in deserializedFrames[0].Keys)
        {
            jointGameObjects[jointName] =
                Instantiate<GameObject>(spherePrefab.gameObject, Vector3.zero, Quaternion.identity);
            jointGameObjects[jointName].transform.localScale = new Vector3(sphereScale, sphereScale, sphereScale);
            jointGameObjects[jointName].GetComponent<Renderer>().material.color = jointColor;
        }

        // Initialize bone names
        
        // Initialize bone names with order
        boneEdgeNames.Add("Pelvis", ("LeftHip", "RightHip"));
        boneEdgeNames.Add("LeftThigh", ("LeftHip", "LeftKnee"));
        boneEdgeNames.Add("LeftFlank", ("LeftHip", "LeftShoulder"));
        
        boneEdgeNames.Add("RightThigh", ("RightHip", "RightKnee"));
        boneEdgeNames.Add("LeftShin", ("LeftKnee", "LeftAnkle"));
        boneEdgeNames.Add("LeftUpperArm", ("LeftShoulder", "LeftElbow"));
        // boneEdgeNames.Add("Shoulders", ("LeftShoulder", "RightShoulder"));        
        boneEdgeNames.Add("RightFlank", ("RightHip", "RightShoulder"));


        boneEdgeNames.Add("RightShin", ("RightKnee", "RightAnkle"));
        boneEdgeNames.Add("LeftForeArm", ("LeftElbow", "LeftWrist"));
        boneEdgeNames.Add("RightUpperArm", ("RightShoulder", "RightElbow"));
        
        boneEdgeNames.Add("RightForeArm", ("RightElbow", "RightWrist"));

        //　Initialize bone objects
        foreach (KeyValuePair<string, (string, string)> boneEdgeName in boneEdgeNames)
        {
            string boneName = boneEdgeName.Key;
            string startJointName = boneEdgeName.Value.Item1;
            string endJointName = boneEdgeName.Value.Item2;
            InstantiateCylinder(
                boneName,
                cylinderPrefab,
                jointGameObjects[startJointName].transform.position,
                jointGameObjects[endJointName].transform.position,
                boneGameObjects
            );
            boneGameObjects[boneName].GetComponent<Renderer>().material.color = jointColor;

            // BoneOrdinalのinit
            var startPoseXY = make2dVector(basePose[startJointName]);
            var endPoseXY = make2dVector(basePose[endJointName]);
            BoneOrdinal boneOrd = BoneOrdinalInit(boneName, startJointName, endJointName,
                Vector2.Distance(startPoseXY, endPoseXY));
            // BoneOrdinal boneOrd = BoneOrdinalInit(boneName, startJointName, endJointName,Vector3.Distance(basePose[startJointName], basePose[endJointName]));
            boneOrdinals.Add(boneName, boneOrd);
        }

        // z補正
        string baseJointName = "LeftHip";
        int counter = 0;
        Dictionary<string, Vector3> lastPosition = jointPositions[100];//new Dictionary<string, Vector3>(); //前の座標を入れておくDictionary
        foreach (var jointFrame in jointPositions) //全てのフレームのjointについてforeach
        {
            if (counter == 80 || counter == 100)
            {
                lastPosition = jointFrame; //0フレーム目では直前フレームをjointFrame[0]とする
            }
            Dictionary<string, Vector3> zCalibratedJointPosition = new Dictionary<string, Vector3>();
            zCalibratedJointPosition.Add(baseJointName, jointFrame[baseJointName]);
            foreach (KeyValuePair<string, BoneOrdinal> boneOrdinal in boneOrdinals)
            {
                string ordinalName = boneOrdinal.Key;
                BoneOrdinal ordinal = boneOrdinal.Value;
                Vector3 startJoint = jointFrame[ordinal.startBone];
                Vector3 endJoint = jointFrame[ordinal.endBone];
                Vector3 baseJoint = zCalibratedJointPosition[ordinal.startBone];
                Vector3 lastTargetJoint = lastPosition[ordinal.endBone];
                var calibratedJoint = CalibrateZ(baseJoint, startJoint, endJoint, lastTargetJoint, ordinal.boneLength, ordinal.endBone);
                if (calibratedJoint.Item2)
                {
                    ngJoints.Add((counter,ordinal.endBone));
                }
                string endBoneName = ordinal.endBone;
                zCalibratedJointPosition.Add(endBoneName, calibratedJoint.Item1);
            }
            lastPosition = zCalibratedJointPosition;
            zCalibratedJointPositions.Add(zCalibratedJointPosition);
            counter++;
        }
        
        // Rigid alignment
        // 意図的に位置ずらしをしたjointsの作成
        for (int i = 0; i < zCalibratedJointPositions.Count; i++)
        {
            var disturbedJointPosition = DisturbJointsPositions(zCalibratedJointPositions[i]);
            jointPositionsDisturbed.Add(disturbedJointPosition);
        }
        
        // rigid alignment 用クラスの初期化
        var rigidAligner = new RigidAlignmentBaseline.RigidAlignmentBaseline(jointPositionsDisturbed[0], zCalibratedJointPositions[0]);
        // disturbed を変形して aligned を生成
        jointPositionsAligned = rigidAligner.RigidTransformFrames(jointPositionsDisturbed);
        
        // GameObjects の初期化 (joints, bones)
        InitializeGameObjects(calibratedJointGameObjects, calibratedBoneGameObjects, isZ: true, Color.blue);
        InitializeGameObjects(jointGameObjectsDisturbed, boneGameObjectsDisturbed, isZ: true, Color.cyan);
        InitializeGameObjects(jointGameObjectsAligned, boneGameObjectsAligned, isZ: true, Color.green);

        frameCount = startFrame;
        frameCountMax = endFrame;
        ShowListContentsInTheDebugLog(keyFrames); // ログにキーフレーム一覧を出力
    }

    // Update is called once per frame
    void Update()
    {
        //以下FPS関連
        timeElapsed += Time.deltaTime;
        //FPSを制御
        if (timeElapsed >= timeOut)
        {
            //この中でアニメーション描画
            Dictionary<string, Vector3> jointFrame = jointPositions[frameCount];
            Dictionary<string, Vector3> jointFrameCalibrated = zCalibratedJointPositions[frameCount];
            Dictionary<string, Vector3> jointFrameDisturbed = jointPositionsDisturbed[frameCount];
            Dictionary<string, Vector3> jointFrameAligned = jointPositionsAligned[frameCount];

            // z軸補正前のjointsのupdate
            // UpdateGameObjects(jointFrame, jointGameObjects, boneGameObjects, true, Color.black);
            
            // z軸補正後のjoints, bonesのupdate
            UpdateGameObjects(jointFrameCalibrated, calibratedJointGameObjects, calibratedBoneGameObjects, false, Color.blue);
            
            // 位置をずらしたjoints, bonesのupdate
            UpdateGameObjects(jointFrameDisturbed, jointGameObjectsDisturbed, boneGameObjectsDisturbed, false, Color.cyan);
            Debug.Log("jointFrameCalibrated updated");
            
            // 位置ずらしを rigid alignment で補正した joints, bones の update
            UpdateGameObjects(jointFrameAligned, jointGameObjectsAligned, boneGameObjectsAligned, false, Color.green);

            // カウンタをインクリメント
            frameCount += 1;

            // 最終フレームに到達した時の処理
            if (frameCount == frameCountMax)
            {
                frameCount = startFrame;
                loopCount += 1;
                if (loopCount == 100)
                {
                    UnityEditor.EditorApplication.isPlaying = false; // 開発環境での停止トリガ
                    // UnityEngine.Application.Quit(); // 本番環境（スタンドアロン）で実行している場合
                }
            }
            timeElapsed = 0.0f;
        }
    }

    private void UpdateGameObjects(Dictionary<string, Vector3> frame, Dictionary<string, GameObject> joints,
        Dictionary<string, GameObject> bones, bool colorKeyFrame, Color color)
    {
        // joint GameObject の update
        foreach (KeyValuePair<string, Vector3> jointPos in frame)
        {
            joints[jointPos.Key].transform.position = jointPos.Value;
            joints[jointPos.Key].GetComponent<Renderer>().material.color = color;
            if (colorKeyFrame)
            {
                if (keyFrames.IndexOf(frameCount) >= 0) joints[jointPos.Key].GetComponent<Renderer>().material.color = Color.red;
                else joints[jointPos.Key].GetComponent<Renderer>().material.color = jointColor;
            }
        }
        
        // bones の update
        foreach (KeyValuePair<string, (string, string)> boneEdgeName in boneEdgeNames)
        {
            string boneName = boneEdgeName.Key;
            string startJointName = boneEdgeName.Value.Item1;
            string endJointName = boneEdgeName.Value.Item2;
            UpdateCylinderPosition(
                bones[boneName],
                joints[startJointName].transform.position,
                joints[endJointName].transform.position
            );
            bones[boneName].GetComponent<Renderer>().material.color = color;
            if (colorKeyFrame)
            {
                if (keyFrames.IndexOf(frameCount) >= 0) bones[boneName].GetComponent<Renderer>().material.color = Color.red;
                else bones[boneName].GetComponent<Renderer>().material.color = jointColor;
            }
        }
    }

    private void InitializeGameObjects(Dictionary<string, GameObject> joints, Dictionary<string, GameObject> bones, bool isZ, Color color)
    //  引数の関節、ボーン用ゲームオブジェクトを初期化する
    {
        foreach (var jointName in deserializedFrames[0].Keys) // 補正用jointをInitialize
        {
            joints[jointName] =
                Instantiate<GameObject>(spherePrefab.gameObject, Vector3.zero, Quaternion.identity);
            joints[jointName].transform.localScale =
                new Vector3(sphereScale, sphereScale, sphereScale);
            joints[jointName].GetComponent<Renderer>().material.color = color;
        }
        
        foreach (KeyValuePair<string, (string, string)> boneEdgeName in boneEdgeNames) // 補正用boneのInitialize
        {
            string boneName = boneEdgeName.Key;
            string startJointName = boneEdgeName.Value.Item1;
            string endJointName = boneEdgeName.Value.Item2;
            if (isZ)
            {
                InstantiateCylinderZ(
                    boneName,
                    cylinderPrefab,
                    jointGameObjects[startJointName].transform.position,
                    jointGameObjects[endJointName].transform.position,
                    bones
                );
            }
            else
            {
                InstantiateCylinder(
                    boneName,
                    cylinderPrefab,
                    jointGameObjects[startJointName].transform.position,
                    jointGameObjects[endJointName].transform.position,
                    bones
                );
            }
            Debug.Log(String.Join(", ", bones.Keys));
            Debug.Log(boneName);
            bones[boneName].GetComponent<Renderer>().material.color = color;
        }
    }

    private void InstantiateCylinder(String key, Transform cylinderPrefab, Vector3 beginPoint, Vector3 endPoint, Dictionary<string, GameObject> bones)
    {
        bones[key] = Instantiate<GameObject>(cylinderPrefab.gameObject, Vector3.zero, Quaternion.identity);
        UpdateCylinderPosition(bones[key], beginPoint, endPoint);
    }
    
    private void InstantiateCylinderZ(String key, Transform cylinderPrefab, Vector3 beginPoint, Vector3 endPoint, Dictionary<string, GameObject> boneGameObjectsTmp)
    {
        boneGameObjectsTmp[key] = Instantiate<GameObject>(cylinderPrefab.gameObject, Vector3.zero, Quaternion.identity);
        UpdateCylinderPosition(boneGameObjectsTmp[key], beginPoint, endPoint);
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

    public void ShowListContentsInTheDebugLog<T>(List<T> list)
    {
        string log = "[";

        foreach (var content in list)
            log += content.ToString() + ", ";

        log += "]";
        Debug.Log(log);
    }

    private void DeleteSameKeyFrames(List<int> list, int frameNumber, int serial)
    {
        for (int i = 0; i < serial; i++)
        {
            if (list.IndexOf(frameNumber - i - 1) >= 0) list.Remove(frameNumber - i - 1);
        }
    }
    
    public struct BoneOrdinal
    {
        public string name;
        public string startBone;
        public string endBone;
        public float boneLength;
    }

    public BoneOrdinal BoneOrdinalInit(string name, string start, string end, float length)
    {
        BoneOrdinal boneOrdinal = new BoneOrdinal();
        boneOrdinal.name = name;
        boneOrdinal.startBone = start;
        boneOrdinal.endBone = end;
        boneOrdinal.boneLength = length;
        return boneOrdinal;
    }

    public (Vector3, bool) CalibrateZ(Vector3 baseJoint, Vector3 rawStartJoint, Vector3 rawEndJoint,
        Vector3 lastTargetJoint,
        float boneLength, string targetJointName)
    {
        float L = -5.0f;
        float x0 = rawEndJoint.x;
        float y0 = rawEndJoint.y;
        float z0 = rawEndJoint.z;
        float xb = baseJoint.x;
        float yb = baseJoint.y;
        float zb = baseJoint.z;
        float A = Mathf.Pow(x0, 2) + Mathf.Pow(y0, 2) + Mathf.Pow(L,2);
        float B = x0 * xb + y0 * yb + Mathf.Pow(L, 2) - L * zb;
        float C = Mathf.Pow(xb, 2) + Mathf.Pow(yb, 2) + Mathf.Pow(L - zb, 2) - Mathf.Pow(boneLength,2);
        Vector3 P = new Vector3();
        bool DMinus = new bool();
        if (B * B >= A * C)
        {
            DMinus = false;
            float t1 = (B + Mathf.Sqrt(B * B - A * C)) / A;
            float t2 = (B - Mathf.Sqrt(B * B - A * C)) / A;
            Debug.Log("A = " + A + ", B = " + B + ", C = " + C + ", t1 = " + t1 + ", t2 = " + t2);
            Vector3 P1 = new Vector3(t1 * rawEndJoint.x, t1 * rawEndJoint.y, (1 - t1) * L);
            Vector3 P2 = new Vector3(t2 * rawEndJoint.x, t2 * rawEndJoint.y, (1 - t2) * L);
            
            if (targetJointName == "LeftAnkle" || targetJointName == "RightAnkle") P = P1;
            else if (targetJointName == "LeftKnee" || targetJointName == "RightKnee") P = P2;
            else if (targetJointName == "LeftShoulder" || targetJointName == "RightShoulder") P = P2;
            else if (targetJointName == "LeftElbow" || targetJointName == "RightElbow") P = P2;
            else if (targetJointName == "LeftWrist" || targetJointName == "RightWrist") P = P1;
            else if (Vector3.SqrMagnitude(P1 - lastTargetJoint) < Vector3.SqrMagnitude(P2 - lastTargetJoint))
                P = P1;
            else P = P2;
        }
        else
        {
            DMinus = true;
            // P.x = 0;
            // P.y = 0;
            // P.z = L;
            Vector3 cameraVec = new Vector3(0, 0, L);
            Vector3 jointXYPlane = new Vector3(rawEndJoint.x, rawEndJoint.y, 0);
            P = cameraVec + Vector3.Project(baseJoint - cameraVec, jointXYPlane - cameraVec); //垂線の足を求める
            Debug.Log("A = " + A + ", B = " + B + ", C = " + C + ", D = " + (B * B - A * C)); 
            Debug.Log("minus");
        }
        return (P,DMinus);
    }

    public Vector2 make2dVector(Vector3 inputVec)
    {
        return new Vector2(inputVec.x, inputVec.y);
    }

    private Dictionary<string, Vector3> DisturbJointsPositions(Dictionary<string, Vector3> joints)
    {
        Vector3 randomTranslation = Vector3.one;
        Dictionary<string, Vector3> modifiedJoints = new Dictionary<string, Vector3>();
        foreach (KeyValuePair<string, Vector3> joint in joints)
        {
            modifiedJoints.Add(joint.Key, joint.Value + randomTranslation);
        }
        return modifiedJoints;
    }
}
