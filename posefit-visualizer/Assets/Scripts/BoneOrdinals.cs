using System.Collections.Generic;
using UnityEngine; // for vector3

using Newtonsoft.Json;

using HumanMotionNs; // for BoneOrdinal

namespace BoneOrdinalsNs
{
    class BoneOrdinals
    {
        // 定数
        public static Dictionary<string, (string, string)> boneEdgeNames =
            new Dictionary<string, (string startJoint, string endJoint)>()
            {
                {"LeftShin", ("LeftAnkle", "LeftKnee")},
                {"LeftThigh", ("LeftKnee", "LeftHip")},
                {"Pelvis", ("LeftHip", "RightHip")},
                {"LeftFlank", ("LeftHip", "LeftShoulder")},
                {"RightThigh", ("RightHip", "RightKnee")},
                {"RightFlank", ("RightHip", "RightShoulder")},
                {"RightShin", ("RightKnee", "RightAnkle")},
                {"RightUpperArm", ("RightShoulder", "RightElbow")},
                {"RightForeArm", ("RightElbow", "RightWrist")},
                {"LeftUpperArm", ("LeftShoulder", "LeftElbow")},
                {"LeftForeArm", ("LeftElbow", "LeftWrist")}
            };

        public static Dictionary<string, BoneOrdinal> JsonToBoneOrdinals(string jsonFilePath, int targetFrameIdx = 100)
        {
            var frames = JsonToFrames(jsonFilePath);
            var targetFrame = frames[targetFrameIdx];
            return GetBoneOrdinals(targetFrame);
        }

        private static Dictionary<string, BoneOrdinal> GetBoneOrdinals(Dictionary<string, Vector3> joints)
        {
            // 特定のフレームの各関節点の情報から、各ボーンの長さを取得する
            var boneOrdinals = new Dictionary<string, BoneOrdinal>();
            foreach (KeyValuePair<string, (string, string)> boneEdgeName in boneEdgeNames)
            {
                var boneName = boneEdgeName.Key;
                var startJointName = boneEdgeName.Value.Item1;
                var endJointName = boneEdgeName.Value.Item2;
                var startPoseXY = Make2dVector(joints[startJointName]);
                var endPoseXY = Make2dVector(joints[endJointName]);
                BoneOrdinal boneOrd = new BoneOrdinal()
                {
                    name = boneName,
                    startJoint = startJointName,
                    endJoint = endJointName,
                    boneLength = Vector2.Distance(startPoseXY, endPoseXY) / 410
                };
                boneOrdinals.Add(boneName, boneOrd);
            }

            return boneOrdinals;
        }

        private static Vector2 Make2dVector(Vector3 inputVec)
        {
            // z成分を無視した 2D ベクトルを生成
            return new Vector2(inputVec.x, inputVec.y);
        }

        private static List<Dictionary<string, Vector3>> JsonToFrames(string jsonFilePath)
        {
            // json ファイルを読み込んで joints 形式に変換する
            var joints = new List<Dictionary<string, Vector3>>();
            var lines = System.IO.File.ReadLines(path: jsonFilePath);
            foreach (var line in lines)
            {
                var joint =
                    JsonConvert.DeserializeObject<Dictionary<string, Vector3>>(line);
                joints.Add(joint);
            }

            return joints;
        }

        public static void ShowInitBone(string jsonFilePath, Transform cylinderPrefab, Transform spherePrefab, Color joint, int targetFrameIdx = 100)
        {
            var frames = JsonToFrames(jsonFilePath);
            var targetFrame = frames[targetFrameIdx];
            
        }
    }
}

