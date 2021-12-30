using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine; // for vector3
using Numpy; // ref. https://github.com/SciSharp/Numpy.NET

namespace rigidAlignment
{
    public class RigidAlignment
    {

        private List<Dictionary<string, Vector3>> rigidTransformJointPositions(Dictionary<string, Vector3> fromKeyFrame, Dictionary<string, Vector3> toKeyFrame, List<Dictionary<string, Vector3>> fromJointPositionFrames)
        {
            var rigidTransformFactors = calcRigidTransformMatrix(fromKeyFrame, toKeyFrame);
            var mse = rigidTransformFactors[0];
            var transformedTo = rigidTransformFactors[1];
            var computedRotation = rigidTransformFactors[2];
            var scaling = rigidTransformFactors[3];
            var translation = rigidTransformFactors[4];
            Debug.Log("mse");
            Debug.Log(mse);
            Debug.Log(transformedTo);
            Debug.Log("transformedTo");
            Debug.Log(computedRotation);
            Debug.Log("computedRotation");
            Debug.Log("scaling");
            Debug.Log(scaling);
            Debug.Log("translation");
            Debug.Log(translation);
            // for (int i = 0; i < fromJointPositionFrames.Count; i++)
            // {
            //     var fromOneFrame = fromJointPositionFrames[i];
            //     Dictionary<string, Vector3> transformedOneFrame;
            //     foreach (KeyValuePair<string, Vector3> fromJointItem in fromOneFrame)
            //     {
            //         var fromJointName = fromJointItem.Key;
            //         var fromJointPos = fromJointItem.Value;
            //         var transformedJointPos = 
            //         transformedOneFrame.Add(fromJointName, );
            //     }
            //
            // }
            return fromJointPositionFrames;
        }
        static List<float[]> calcRigidTransformMatrix(Dictionary<string, Vector3> fromJoints, Dictionary<string, Vector3> toJoints)
        {
            // NOTE: cast to np.array
            float[][] fromJointsArr = new float[numOfJoints][]; //  = new float[numOfJoints][3];
            float[][] toJointsArr = new float[numOfJoints][]; // = new float[numOfJoints][3];
            foreach (var it in jointNames.Select((x, i) => new { Value = x, Index = i }))
            {
                var idx = it.Index;
                var jointName = it.Value;
                var fromJoint = fromJoints[jointName];
                var fromPos = new float[] { fromJoint.x, fromJoint.y, fromJoint.z };
                // fromJointsList.Add(fromPos);
                fromJointsArr[idx] = fromPos;

                var toJoint = toJoints[jointName];
                var toPos = new float[] { toJoint.x, toJoint.y, toJoint.z };
                toJointsArr[idx] = toPos;
            }

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
            "leftEyeInner",
            "leftEye",
            "leftEyeOuter",
            "rightEyeInner",
            "rightEye",
            "rightEyeOuter",
            "leftEar",
            "rightEar",
            "mouthLeft",
            "mouthRight",
            "leftShoulder",
            "rightShoulder",
            "leftElbow",
            "rightElbow",
            "leftWrist",
            "rightWrist",
            "leftPinkyFinger",
            "rightPinkyFinger",
            "leftIndexFinger",
            "rightIndexFinger",
            "leftThumb",
            "rightThumb",
            "leftHip",
            "rightHip",
            "leftKnee",
            "rightKnee",
            "leftAnkle",
            "rightAnkle",
            "leftHeel",
            "rightHeel",
            "leftToe",
            "rightToe"
        };
        static int numOfJoints = jointNames.Count;
    }
}

