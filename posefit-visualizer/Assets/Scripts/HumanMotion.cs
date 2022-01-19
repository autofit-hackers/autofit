using System;
using System.Collections.Generic;
using UnityEngine;

using Newtonsoft.Json;

using BoneOrdinalsNs;

namespace HumanMotionNs
{
    struct BoneOrdinal
    {
        // bone を startJoint -> endJoint で表現されることを定義する
        public string name;
        public string startJoint;
        public string endJoint;
        public float boneLength;
    };

    struct HumanMotionSettings
    {
        public string jsonFilePath;
        public Transform cylinderPrefab;
        public Transform spherePrefab;
        public Color jointColor;
        public float timeOut;
        public float lpfRate;
        public int startFrame;
        public int endFrame;
        public float sphereScale;
        public int keyFrameMargin; // KyeFrame 検出の hyper parameter
        public Dictionary<string, BoneOrdinal> boneOrdinals;
    }

    struct HumanMotionState
    {
        // 前回の可視化から経過した時間
        public float timeElapsed;

        // jsonからロードしたフレームを格納、加工を加えて最終的に可視化するデータを格納する mutable なオブジェクト
        public List<Dictionary<string, Vector3>> deserializedFrames;
        public List<Dictionary<string, Vector3>> jointPositions;

        // z補正前のデータ
        public Dictionary<string, GameObject> jointGameObjects;
        public Dictionary<string, GameObject> boneGameObjects;

        // key frame 検出のために利用する各フレームにおける各 joint の速度
        public List<Dictionary<string, Vector3>> jointSpeeds;

        // key frame の リスト
        public List<int> keyFrames;

        // z補正後のデータ
        public List<Dictionary<string, Vector3>> zCalibratedJointPositions;
        public Dictionary<string, GameObject> zCalibratedJointGameObjects;
        public Dictionary<string, GameObject> zCalibratedBoneGameObjects;

        // z軸補正時の判別式が負になる点の集合
        public List<(int, string)> ngJoints;
        
        // 
        public Dictionary<string, BoneOrdinal> boneOrdinals;
    }

    class HumanMotion
    {
        // インスタンス変数として扱う設定値は構造体にまとめる
        public HumanMotionSettings settings;

        public HumanMotionState state;
        // private GameObject cylinder;


        // XXX: loopCount と frameCount の違いがわかる変数名にする
        private int loopCount;
        public int frameCount;
        public int frameCountMax;


        public HumanMotion(
            string jsonFilePath,
            Dictionary<string, BoneOrdinal> boneOrdinals,
            Transform cylinderPrefab,
            Transform spherePrefab,
            Color jointColor,
            float timeOut = 0.05f,
            float lpfRate = 0.2f,
            int startFrame = 10,
            int endFrame = 100,
            float sphereScale = 0.1f,
            int keyFrameMargin = 10
        )
        {
            // settings
            settings = new HumanMotionSettings()
            {
                jsonFilePath = jsonFilePath,
                boneOrdinals = boneOrdinals,
                cylinderPrefab = cylinderPrefab,
                spherePrefab = spherePrefab,
                jointColor = jointColor,
                timeOut = timeOut,
                lpfRate = lpfRate,
                startFrame = startFrame,
                endFrame = endFrame,
                sphereScale = sphereScale,
                keyFrameMargin = keyFrameMargin
            };
            // state
            state = new HumanMotionState()
            {
                timeElapsed = 0.0f,
                deserializedFrames = new List<Dictionary<string, Vector3>>(),
                jointPositions = new List<Dictionary<string, Vector3>>(),
                keyFrames = new List<int>(),
                jointGameObjects = new Dictionary<string, GameObject>(),
                boneGameObjects = new Dictionary<string, GameObject>(),
                jointSpeeds = new List<Dictionary<string, Vector3>>(),
                zCalibratedJointPositions = new List<Dictionary<string, Vector3>>(),
                zCalibratedJointGameObjects = new Dictionary<string, GameObject>(),
                zCalibratedBoneGameObjects = new Dictionary<string, GameObject>(),
                ngJoints = new List<(int, string)>(),
            };

            // loop state
            loopCount = 0;
            frameCount = 0;
        }

        public void ReadAndPreprocess()
        {
            // tmp 変数
            List<Vector3> bodySpeeds = new List<Vector3>();
            Vector3 startPosition = new Vector3();
            Dictionary<string, Vector3> basePose = new Dictionary<string, Vector3>();
            Dictionary<string, GameObject> jointGameObjects = new Dictionary<string, GameObject>();
            Dictionary<string, GameObject> boneGameObjects = new Dictionary<string, GameObject>();
            Dictionary<string, Vector3> lastFramePoses = new Dictionary<string, Vector3>();

            // 1行ずつ iterate して読み込み
            int lineCount = 0;
            IEnumerable<string> lines = System.IO.File.ReadLines(path: settings.jsonFilePath);
            foreach (string line in lines)
            {
                Dictionary<string, Vector3> deserializedFrame =
                    JsonConvert.DeserializeObject<Dictionary<string, Vector3>>(line);
                state.deserializedFrames.Add(deserializedFrame);

                Dictionary<string, Vector3> tmpPos = new Dictionary<string, Vector3>();
                Dictionary<string, Vector3> tmpSpd = new Dictionary<string, Vector3>();
                Vector3 bodySpd = new Vector3();
                Vector3 bodyPos = new Vector3();

                // ローパスをかける & 瞬間速度を計算する
                foreach (KeyValuePair<string, Vector3> jointItem in deserializedFrame)
                {
                    string jointName = jointItem.Key;
                    Vector3 joint = jointItem.Value;

                    // Joint の 中身を vector3 に格納
                    Vector3 latestPosition = new Vector3();
                    // latestPosition.x = (joint.y - 960f) / 400;
                    // latestPosition.y = -((joint.x - 540f) / 400);
                    latestPosition.y = -((joint.y - 960f) / 400);
                    latestPosition.x = (joint.x - 540f) / 400;
                    latestPosition.z = joint.z / 400;
                    if (jointName == "LeftAnkle")
                    {
                        latestPosition.z = 0f;
                    }
                    // latestPosition.x = joint.x / 100;
                    // latestPosition.y = joint.y / 100;
                    // latestPosition.z = -(joint.z / 100 - 1f);
                    if (lineCount == 0)
                        lastFramePoses.Add(jointName, latestPosition); // 1ループ目の時はdicに要素を追加

                    // LPF
                    Vector3 lowpassFilteredPosition = new Vector3();
                    lowpassFilteredPosition = lastFramePoses[jointName] * settings.lpfRate +
                                              latestPosition * (1 - settings.lpfRate); // ローパス後のposを計算
                    Vector3 jointSpeed = lowpassFilteredPosition - lastFramePoses[jointName];
                    lastFramePoses[jointName] = lowpassFilteredPosition;

                    // TmpDicに関節のposition情報を格納
                    tmpPos.Add(jointName, lowpassFilteredPosition);
                    tmpSpd.Add(jointName, jointSpeed);

                    // キーフレーム抽出用に重心の算出
                    bodySpd += jointSpeed;
                    bodyPos += lowpassFilteredPosition;
                }

                state.jointPositions.Add(tmpPos); // JointPos=Dic<string,Vector3>()にローパス済みのposをAdd
                state.jointSpeeds.Add(tmpSpd);
                bodySpeeds.Add(bodySpd);
                if (lineCount == settings.startFrame)
                    startPosition = bodyPos; //最初のフレームにおいて重心の初期位置を定義

                float bodyVel = Mathf.Sqrt(bodySpd.x * bodySpd.x + bodySpd.y * bodySpd.y + bodySpd.z * bodySpd.z);

                // キーフレーム抽出
                if (lineCount > settings.startFrame && lineCount < settings.endFrame)
                {
                    if (bodyVel < 0.5 && Vector3.Angle(startPosition, bodyPos) < 20)
                    {
                        state.keyFrames.Add(lineCount);
                        DeleteSameKeyFrames(state.keyFrames, lineCount, settings.keyFrameMargin);
                        // Debug.Log("frameNumber -> " + lineCount + ", angle -> ");
                        // Debug.Log(Vector3.Angle(startPosition, bodyPos));
                    }
                    // Debug.Log("frameNumber -> " + lineCount + ", bodySpeed -> " + bodySpd + ", bodyVel -> " + bodyVel);
                }

                // z軸補正のための基準フレーム抽出
                if (lineCount == 160) basePose = tmpPos;

                lineCount += 1;
            }

            // 最終フレームの定義
            frameCountMax = state.deserializedFrames.Count;
            if (frameCountMax <= settings.endFrame)
            {
                settings.endFrame = frameCountMax - 1; //frameCountMaxがendFrameを超えてしまわないようにする
            }

            var slicedFrames = settings.endFrame - settings.startFrame;
            // [startFrame:endFrame] をスライス
            // TODO: update内で処理する
            state.deserializedFrames = state.deserializedFrames.GetRange(settings.startFrame, slicedFrames);
            frameCountMax = state.deserializedFrames.Count;

            // Initialize joint objects
            // NOTE: get joint names from 0 frame of deserializedFrames
            foreach (var jointName in state.deserializedFrames[0].Keys)
            {
                jointGameObjects[jointName] =
                    GameObject.Instantiate(settings.spherePrefab.gameObject, Vector3.zero, Quaternion.identity) as
                        GameObject;
                // Instantiate<GameObject>(spherePrefab.gameObject, Vector3.zero, Quaternion.identity);
                jointGameObjects[jointName].transform.localScale = new Vector3(settings.sphereScale,
                    settings.sphereScale, settings.sphereScale);
                jointGameObjects[jointName].GetComponent<Renderer>().material.color = settings.jointColor;
            }

            //　Initialize bone objects
            foreach (KeyValuePair<string, (string, string)> boneEdgeName in BoneOrdinals.boneEdgeNames)
            {
                string boneName = boneEdgeName.Key;
                string startJointName = boneEdgeName.Value.Item1;
                string endJointName = boneEdgeName.Value.Item2;
                InstantiateCylinder(
                    boneName,
                    settings.cylinderPrefab,
                    jointGameObjects[startJointName].transform.position,
                    jointGameObjects[endJointName].transform.position,
                    boneGameObjects
                );
                boneGameObjects[boneName].GetComponent<Renderer>().material.color = settings.jointColor;
            }

            // z補正
            string baseJointName = "LeftAnkle";
            int counter = 0;
            Dictionary<string, Vector3>
                lastPosition = state.jointPositions[100]; //new Dictionary<string, Vector3>(); //前の座標を入れておくDictionary
            foreach (var jointFrame in state.jointPositions) //全てのフレームのjointについてforeach
            {
                if (counter == 0)
                    lastPosition = jointFrame; //0フレーム目では直前フレームをjointFrame[0]とする

                var zCalibratedJointPosition = new Dictionary<string, Vector3>();
                zCalibratedJointPosition.Add(baseJointName, jointFrame[baseJointName]);
                foreach (KeyValuePair<string, BoneOrdinal> boneOrdinal in settings.boneOrdinals)
                {
                    string ordinalName = boneOrdinal.Key;
                    BoneOrdinal ordinal = boneOrdinal.Value;
                    Vector3 startJoint = jointFrame[ordinal.startJoint];
                    Vector3 endJoint = jointFrame[ordinal.endJoint];
                    Vector3 baseJoint = zCalibratedJointPosition[ordinal.startJoint];
                    Vector3 lastTargetJoint = lastPosition[ordinal.endJoint];
                    var calibratedJoint = CalibrateZ(baseJoint, startJoint, endJoint, lastTargetJoint,
                        ordinal.boneLength, ordinal.endJoint);
                    if (calibratedJoint.Item2)
                    {
                        state.ngJoints.Add((counter, ordinal.endJoint));
                    }

                    string endJointName = ordinal.endJoint;
                    zCalibratedJointPosition.Add(endJointName, calibratedJoint.Item1);
                    
                    //LPF
                    var jpAfterLPF = lastPosition[endJointName] * settings.lpfRate +
                                     zCalibratedJointPosition[endJointName] * (1 - settings.lpfRate); // ローパス後のposを計算
                    lastPosition[endJointName] = jpAfterLPF;
                    //LPFここまで
                    
                }
                lastPosition = zCalibratedJointPosition;
                state.zCalibratedJointPositions.Add(zCalibratedJointPosition);
                counter++;
            }
            
            // z軸に関して再度LPF
            // Dictionary<string, Vector3> lastJP = new Dictionary<string, Vector3>();
            // for (int idx = 0; idx < state.zCalibratedJointPositions.Count; idx++)
            // {
            //     var calibratedJP = state.zCalibratedJointPositions[idx];
            //     if (idx == 0)
            //     {
            //         lastJP = calibratedJP;
            //         continue;
            //     }
            //     foreach (string jointName in calibratedJP.Keys)
            //     {
            //         // Vector3 jpAfterLPF = new Vector3();
            //         var jpAfterLPF = lastJP[jointName] * settings.lpfRate +
            //                                   calibratedJP[jointName] * (1 - settings.lpfRate); // ローパス後のposを計算
            //         lastJP[jointName] = jpAfterLPF;
            //     }
            //     state.zCalibratedJointPositions[idx] = lastJP;
            // }

            // Rigid alignment
            // 意図的に位置ずらしをしたjointsの作成
            // for (int i = 0; i < state.zCalibratedJointPositions.Count; i++)
            // {
            //     var disturbedJointPosition = state.disturbJointsPositions(zCalibratedJointPositions[i]);
            //     state.jointPositionsDisturbed.Add(disturbedJointPosition);
            // }
            //
            // rigid alignment 用クラスの初期化
            // var rigidAligner = new RigidAlignmentBaseline.RigidAlignmentBaseline(jointPositionsDisturbed[0], zCalibratedJointPositions[0]);
            // disturbed を変形して aligned を生成
            // jointPositionsAligned = rigidAligner.RigidTransformFrames(jointPositionsDisturbed);

            // GameObjects の初期化 (joints, bones)
            // 補正前
            // InitializeGameObjects(state.jointGameObjects, state.boneGameObjects, isZ: true, color: settings.jointColor);
            
            // 補正後
            InitializeGameObjects(state.zCalibratedJointGameObjects, state.zCalibratedBoneGameObjects, isZ: true,
                color: settings.jointColor);
            // InitializeGameObjects(jointGameObjectsDisturbed, boneGameObjectsDisturbed, isZ: true, Color.cyan);
            // InitializeGameObjects(jointGameObjectsAligned, boneGameObjectsAligned, isZ: true, Color.green);

            frameCount = settings.startFrame;
            frameCountMax = settings.endFrame;
            ShowListContentsInTheDebugLog(state.keyFrames); // ログにキーフレーム一覧を出力
        }

// Update is called once per frame
        public void FrameStep()
        {
            //以下FPS関連
            state.timeElapsed += Time.deltaTime;
            //FPSを制御
            if (state.timeElapsed >= settings.timeOut)
            {
                //この中でアニメーション描画
                // Dictionary<string, Vector3> jointFrameDisturbed = jointPositionsDisturbed[frameCount];
                // Dictionary<string, Vector3> jointFrameAligned = jointPositionsAligned[frameCount];

                // z軸補正前のjointsのupdate
                // UpdateGameObjects(frame: state.jointPositions[frameCount], state.jointGameObjects, state.boneGameObjects, true, Color.black);

                // z軸補正後のjoints, bonesのupdate
                UpdateGameObjects(frame: state.zCalibratedJointPositions[frameCount], state.zCalibratedJointGameObjects,
                    state.zCalibratedBoneGameObjects, false, settings.jointColor);

                // 位置をずらしたjoints, bonesのupdate
                // UpdateGameObjects(jointFrameDisturbed, jointGameObjectsDisturbed, boneGameObjectsDisturbed, false, Color.cyan);

                // 位置ずらしを rigid alignment で補正した joints, bones の update
                // UpdateGameObjects(jointFrameAligned, jointGameObjectsAligned, boneGameObjectsAligned, false, Color.green);

                // カウンタをインクリメント
                frameCount += 1;

                // 最終フレームに到達した時の処理
                if (frameCount == frameCountMax)
                {
                    frameCount = settings.startFrame;
                    loopCount += 1;
                    if (loopCount == 100)
                    {
                        UnityEditor.EditorApplication.isPlaying = false; // 開発環境での停止トリガ
                        // UnityEngine.Application.Quit(); // 本番環境（スタンドアロン）で実行している場合
                    }
                }

                state.timeElapsed = 0.0f;
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
                    if (state.keyFrames.IndexOf(frameCount) >= 0)
                        joints[jointPos.Key].GetComponent<Renderer>().material.color = Color.red;
                    else joints[jointPos.Key].GetComponent<Renderer>().material.color = settings.jointColor;
                }
            }

            // bones の update
            foreach (KeyValuePair<string, (string, string)> boneEdgeName in BoneOrdinals.boneEdgeNames)
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
                    if (state.keyFrames.IndexOf(frameCount) >= 0)
                        bones[boneName].GetComponent<Renderer>().material.color = Color.red;
                    else bones[boneName].GetComponent<Renderer>().material.color = settings.jointColor;
                }
            }
        }

        private void InitializeGameObjects(Dictionary<string, GameObject> joints, Dictionary<string, GameObject> bones,
                bool isZ, Color color)
            //  引数の関節、ボーン用ゲームオブジェクトを初期化する
        {
            foreach (var jointName in state.deserializedFrames[0].Keys) // 補正用jointをInitialize
            {
                joints[jointName] =
                    GameObject.Instantiate(settings.spherePrefab.gameObject, Vector3.zero, Quaternion.identity);
                joints[jointName].transform.localScale =
                    new Vector3(settings.sphereScale, settings.sphereScale, settings.sphereScale);
                joints[jointName].GetComponent<Renderer>().material.color = color;
            }

            foreach (KeyValuePair<string, (string, string)> boneEdgeName in BoneOrdinals.boneEdgeNames) // 補正用boneのInitialize
            {
                string boneName = boneEdgeName.Key;
                string startJointName = boneEdgeName.Value.Item1;
                string endJointName = boneEdgeName.Value.Item2;
                if (isZ)
                {
                    InstantiateCylinderZ(
                        boneName,
                        settings.cylinderPrefab,
                        joints[startJointName].transform.position,
                        joints[endJointName].transform.position,
                        bones
                    );
                }
                else
                {
                    InstantiateCylinder(
                        boneName,
                        settings.cylinderPrefab,
                        joints[startJointName].transform.position,
                        joints[endJointName].transform.position,
                        bones
                    );
                }

                // Debug.Log(String.Join(", ", bones.Keys));
                // Debug.Log(boneName);
                bones[boneName].GetComponent<Renderer>().material.color = color;
            }
        }

        private void InstantiateCylinder(String key, Transform cylinderPrefab, Vector3 beginPoint, Vector3 endPoint,
            Dictionary<string, GameObject> bones)
        {
            bones[key] = GameObject.Instantiate(cylinderPrefab.gameObject, Vector3.zero, Quaternion.identity);
            UpdateCylinderPosition(bones[key], beginPoint, endPoint);
        }

        private void InstantiateCylinderZ(String key, Transform cylinderPrefab, Vector3 beginPoint, Vector3 endPoint,
            Dictionary<string, GameObject> boneGameObjectsTmp)
        {
            boneGameObjectsTmp[key] =
                GameObject.Instantiate(cylinderPrefab.gameObject, Vector3.zero, Quaternion.identity);
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
            // serial 以上に連続するフレームがキーフレームと認識されていた場合、キーフレームでない扱いにする。
            for (int i = 0; i < serial; i++)
            {
                if (list.IndexOf(frameNumber - i - 1) >= 0) list.Remove(frameNumber - i - 1);
            }
        }



        public (Vector3, bool) CalibrateZ(Vector3 baseJoint, Vector3 rawStartJoint, Vector3 rawEndJoint,
            Vector3 lastTargetJoint,
            float boneLength, string targetJointName)
        {
            var L = -4.8f;
            var x0 = rawEndJoint.x;
            var y0 = rawEndJoint.y;
            var z0 = rawEndJoint.z;
            var xb = baseJoint.x;
            var yb = baseJoint.y;
            var zb = baseJoint.z;
            var A = Mathf.Pow(x0, 2) + Mathf.Pow(y0, 2) + Mathf.Pow(L, 2);
            var B = x0 * xb + y0 * yb + Mathf.Pow(L, 2) - L * zb;
            var C = Mathf.Pow(xb, 2) + Mathf.Pow(yb, 2) + Mathf.Pow(L - zb, 2) - Mathf.Pow(boneLength, 2);
            Vector3 P = new Vector3();
            bool DMinus = new bool();
            if (B * B >= A * C)
            {
                DMinus = false;
                var t1 = (B + Mathf.Sqrt(B * B - A * C)) / A;
                var t2 = (B - Mathf.Sqrt(B * B - A * C)) / A;
                // Debug.Log("A = " + A + ", B = " + B + ", C = " + C + ", t1 = " + t1 + ", t2 = " + t2);
                var P1 = new Vector3(t1 * rawEndJoint.x, t1 * rawEndJoint.y, (1 - t1) * L);
                var P2 = new Vector3(t2 * rawEndJoint.x, t2 * rawEndJoint.y, (1 - t2) * L);

                // ヒューリスティックに２つの交点のどちらかを選択する
                if (targetJointName == "LeftHip" || targetJointName == "RightAnkle") P = P1;
                else if (targetJointName == "LeftKnee" || targetJointName == "RightKnee") P = P2;
                else if (targetJointName == "LeftShoulder" || targetJointName == "RightShoulder") P = P2;
                else if (targetJointName == "LeftElbow" || targetJointName == "RightElbow") P = P1;
                else if (targetJointName == "LeftWrist" || targetJointName == "RightWrist") P = P2;
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
                // Debug.Log("A = " + A + ", B = " + B + ", C = " + C + ", D = " + (B * B - A * C));
                Debug.Log("minus");
            }

            return (P, DMinus);
        }

        private static Vector2 Make2dVector(Vector3 inputVec)
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
        
        private static Dictionary<string, BoneOrdinal> GetBoneOrdinals(Dictionary<string, Vector3> basePose)
        {
            // 特定のフレームの各関節点の情報から、各ボーンの長さを取得する
            var boneOrdinals = new Dictionary<string, BoneOrdinal>();
            foreach (KeyValuePair<string, (string, string)> boneEdgeName in BoneOrdinals.boneEdgeNames)
            {
                var boneName = boneEdgeName.Key;
                var startJointName = boneEdgeName.Value.Item1;
                var endJointName = boneEdgeName.Value.Item2;
                var startPoseXY = Make2dVector(basePose[startJointName]);
                var endPoseXY = Make2dVector(basePose[endJointName]);
                BoneOrdinal boneOrd = new BoneOrdinal()
                {
                    name = boneName,
                    startJoint = startJointName,
                    endJoint = endJointName,
                    boneLength = Vector2.Distance(startPoseXY, endPoseXY)
                };
                boneOrdinals.Add(boneName, boneOrd);
            }
            return boneOrdinals;
        }
    }
}