using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine; // for vector3

namespace RigidAlignmentBaseline
{
    public class RigidAlignmentBaseline
    {
        public Dictionary<string, Vector3> fromJoints;
        public Dictionary<string, Vector3> toJoints;
        private Vector3 fromNormalVector;
        private Vector3 toNormalVector;
        private Vector3 fromCenterOfGravity;
        private Vector3 toCenterOfGravity;
        private Quaternion fromToRotation = new Quaternion();
        
        public RigidAlignmentBaseline(Dictionary<string, Vector3> fromKeyFrame, Dictionary<string, Vector3> toKeyFrame)
        {
            fromJoints = fromKeyFrame;
            toJoints = toKeyFrame;
            fromNormalVector = CalcNormalVector(fromJoints);
            toNormalVector = CalcNormalVector(toJoints);
            fromCenterOfGravity = CalcCenterOfGravityVector(fromJoints);
            toCenterOfGravity = CalcCenterOfGravityVector(toJoints);
            fromToRotation.SetFromToRotation(fromNormalVector, toNormalVector);
        }

        public Vector3 CalcNormalVector(Dictionary<string, Vector3> joints)
        {
            // 肩の2点と腰の1点（腰は2点の平均座標）が張る平面に直行する法線ベクトルを得る
            // ref. https://docs.unity3d.com/ja/2019.4/Manual/ComputingNormalPerpendicularVector.html
            var wristVector = Vector3.Lerp(joints["LeftWrist"], joints["RightWrist"], 0.5f);
            var side1 = joints["RightShoulder"] - wristVector;
            var side2 = joints["LeftShoulder"] - wristVector;
            var perp = Vector3.Cross(side1, side2);
            return perp.normalized;
        }
        
        public Vector3 CalcCenterOfGravityVector(Dictionary<string, Vector3> joints)
        {
            var centerOfGravity = Vector3.zero;
            foreach (var joint in joints.Values)
            {
                centerOfGravity += joint;
            }
            return centerOfGravity / joints.Count;
        }

        static Vector3 RotateAroundPoint(Vector3 point, Vector3 pivot, Quaternion rotation)
        {
            var finalPos = point - pivot;
            // Center the point around the origin
            finalPos = rotation * finalPos;
            //Rotate the point.
            finalPos += pivot;
            return finalPos;
        }

        public Dictionary<string, Vector3> RigidTransformJoints(Dictionary<string, Vector3> joints, Vector3 pivot, Quaternion rotation)
        {
            Dictionary<string, Vector3> rotatedJoints = new Dictionary<string, Vector3>();
            foreach (KeyValuePair<string, Vector3> joint in joints)
            {
                rotatedJoints.Add(joint.Key, RotateAroundPoint(joint.Value, pivot, rotation));
            }
            return rotatedJoints;
        }
        
        public List<Dictionary<string, Vector3>> RigidTransformFrames(List<Dictionary<string, Vector3>> fromFrames)
        {
            List<Dictionary<string, Vector3>> transformedFrames = new List<Dictionary<string, Vector3>>();

            for (int i = 0; i < fromFrames.Count; i++)
            {
                var _fromJoints = fromFrames[i];
                Dictionary<string, Vector3> transformedJoints = new Dictionary<string, Vector3>();

                foreach (KeyValuePair<string, Vector3> fromJoint in _fromJoints)
                {
                    // 重心位置をtoに合わせる
                    var transformedJoint = fromJoint.Value - this.fromCenterOfGravity + this.toCenterOfGravity ;
                    // toまわりに回転させる
                    transformedJoints.Add(fromJoint.Key, RotateAroundPoint(transformedJoint, this.toCenterOfGravity, this.fromToRotation));
                }
                transformedFrames.Add(transformedJoints);
            }
            return transformedFrames;
        }
    }
}

