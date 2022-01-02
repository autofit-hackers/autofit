using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine; // for vector3
using Numpy; // ref. https://github.com/SciSharp/Numpy.NET

namespace RigidAlignment
{
    public class RigidAlignment
    {
        public List<float[]> rigidTransformFactors;
        public Vector3 transformedTo;
        public Vector3 computedRotation;
        public Vector3 translation;
        
        public RigidAlignment(Dictionary<string, Vector3> fromKeyFrame, Dictionary<string, Vector3> toKeyFrame)
        {
            rigidTransformFactors = CalcRigidTransformMatrix(fromKeyFrame, toKeyFrame);
            // var mse = arrayToVec3(rigidTransformFactors[0]);
            transformedTo = ArrayToVec3(rigidTransformFactors[1]);
            Debug.Log("transformedTo");
            Debug.Log(transformedTo);
            computedRotation = ArrayToVec3(rigidTransformFactors[2]);
            Debug.Log("computedRotation");
            Debug.Log(computedRotation);
            // var scaling = arrayToVec3(rigidTransformFactors[3]);
            translation = ArrayToVec3(rigidTransformFactors[4]);
            Debug.Log("translation");
            Debug.Log(translation);
            // Debug.Log("scaling");
            // Debug.Log(scaling);
        }
        
        public  List<Dictionary<string, Vector3>> RigidTransformFrames(List<Dictionary<string, Vector3>> fromFrames)
        {
            List<Dictionary<string, Vector3>> transformedFrames = new List<Dictionary<string, Vector3>>();

            for (int i = 0; i < fromFrames.Count; i++)
            {
                var fromJointPositions = fromFrames[i];
                Dictionary<string, Vector3> transformedJoints = new Dictionary<string, Vector3>();

                foreach (var jointName in jointNames)
                {
                    var fromJointPos = fromJointPositions[jointName];
                    var transformedJoint = fromJointPos + translation;
                    transformedJoints.Add(jointName, transformedJoint);
                }
                
                // Dictionary<string, Vector3> transformedOneFrame = new Dictionary<string, Vector3>();
                // foreach (KeyValuePair<string, Vector3> fromJointItem in fromJointPositions)
                // {
                //     var fromJointName = fromJointItem.Key;
                //     var fromJointPos = fromJointItem.Value;
                //     var transformedJointPos = fromOneFrame;
                //     transformedOneFrame.Add(fromJointName, transformedJointPos);
                // }

                transformedFrames.Add(transformedJoints);
            }
            return transformedFrames;
        }

        private static Vector3 ArrayToVec3(float[] xyzArr)
        {
            return new Vector3(x: xyzArr[0], y: xyzArr[1], xyzArr[2]);
        }

        private static float[,] JointsToArray(Dictionary<string, Vector3> joints)
        {
            Debug.Log(string.Join(",", joints.Keys));
            float[,] jointsArr = new float[numOfJoints,3];
            foreach (var it in jointNames.Select((x, i) => new {Value = x, Index = i}))
            {
                var idx = it.Index;
                var jointName = it.Value;
                var joint = joints[jointName];
                // jointsArr[idx] = new float[] {joint.x, joint.y, joint.z};
                jointsArr[idx, 0] = joint.x;
                jointsArr[idx, 1] = joint.y;
                jointsArr[idx, 2] = joint.z;
            }
            return jointsArr;
        }
        
        private static Dictionary<string, Vector3> ArrayToJoints(float[][] jointsArr)
        {
            Dictionary<string, Vector3> joints = new Dictionary<string, Vector3>();
            foreach (var it in jointNames.Select((x, i) => new {Value = x, Index = i}))
            {
                var idx = it.Index;
                var jointName = it.Value;
                Vector3 jointVec = new Vector3(x: jointsArr[idx][0], y: jointsArr[idx][1], z: jointsArr[idx][2]);
                joints.Add(jointName, jointVec);
            }
            return joints;
        }
        
        private static List<float[]> CalcRigidTransformMatrix(Dictionary<string, Vector3> fromJoints, Dictionary<string, Vector3> toJoints)
        {
            Debug.Log("CalcRigidTransformMatrix");
            float[,] fromJointsArr = JointsToArray(fromJoints);
            float[,] toJointsArr = JointsToArray(toJoints);
            Debug.Log("fromJointsArr");
            Debug.Log(fromJointsArr);
            Debug.Log("toJointsArr");
            Debug.Log(toJointsArr);

            var fromJointsNp = np.array(fromJointsArr);
            var toJointsNp = np.array(toJointsArr);
            
            /*
            ref. https://github.com/una-dinosauria/3d-pose-baseline/blob/666080d86a96666d499300719053cc8af7ef51c8/src/procrustes.py
            A port of MATLAB's `procrustes` function to Numpy.
            Adapted from http://stackoverflow.com/a/18927641/1884420
            Args
                from: array NxM of targets, with N number of points and M point dimensionality
                to: array NxM of inputs
                compute_optimal_scale: whether we compute optimal scale or force it to be 1
            Returns:
                d: squared error after transformation
                Z: transformed to
                T: computed rotation
                b: scaling
                c: translation
            */

            var muFrom = fromJointsNp.mean(0);
            var muTo = toJointsNp.mean(0);

            var from0 = fromJointsNp - muFrom;
            var to0 = toJointsNp - muTo;

            var ssFrom = (from0 * from0).sum();
            var ssTo = (to0 * to0).sum();

            // centred Frobenius norm
            var normfrom = np.sqrt(ssFrom);
            var normto = np.sqrt(ssTo);

            // scale to equal (unit) norm
            from0 = from0 / normfrom;
            to0 = to0 / normto;

            // optimum rotation matrix of to
            var A = np.dot(from0.T, to0);
            (NDarray, NDarray, NDarray) svdResult = np.linalg.svd(A, full_matrices: true); //  full_matrices = False);
            var U = svdResult.Item1;
            var s = svdResult.Item2;
            var Vt = svdResult.Item3;
            
            var V = Vt.T;
            var T = np.dot(V, U.T);

            // Make sure we have a rotation
            var detT = np.linalg.det(T);
            V[":, -1"].imul(np.sign(detT));
            s["-1"].imul(np.sign(detT));
            T = np.dot(V, U.T);

            var traceTA = s.sum();

            // Compute optimum scaling of to.
            var b = traceTA * normfrom / normto;
            var d = 1.0 - traceTA * traceTA;
            var Z = normfrom * traceTA * np.dot(to0, T) + muFrom;

            var c = muFrom - b * np.dot(muTo, T);

            return new List<float[]>{d.GetData<float>(), Z.GetData<float>(), T.GetData<float>(), b.GetData<float>(), c.GetData<float>()};
        }

        static List<string> jointNames = new List<string> {
            "Nose",
            "LeftEyeInner",
            "LeftEye",
            "LeftEyeOuter",
            "RightEyeInner",
            "RightEye",
            "RightEyeOuter",
            "LeftEar",
            "RightEar",
            "MouthLeft",
            "MouthRight",
            "LeftShoulder",
            "RightShoulder",
            "LeftElbow",
            "RightElbow",
            "LeftWrist",
            "RightWrist",
            "LeftPinkyFinger",
            "RightPinkyFinger",
            "LeftIndexFinger",
            "RightIndexFinger",
            "LeftThumb",
            "RightThumb",
            "LeftHip",
            "RightHip",
            "LeftKnee",
            "RightKnee",
            "LeftAnkle",
            "RightAnkle",
            "LeftHeel",
            "RightHeel",
            "LeftToe",
            "RightToe"
        };
        private static int numOfJoints = jointNames.Count;
    }
}

