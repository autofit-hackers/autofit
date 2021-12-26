using System;
using System.Collection.Generic;

using UnityEngine; // for vector3
using Numpy; // ref. https://github.com/SciSharp/Numpy.NET

namespace rigidAlignment
{
    public class RigidAlignment
    {
        static List<double[]> Main(Dictionary<string, Vector3> fromJoints, Dictionary<string, Vector3> toJoints)
        {
            // NOTE: cast to np.array
            float[][] fromJointsArr = new float[jointNames.GetLength(0)][3];
            float[][] toJointsArr = new float[jointNames.GetLength(0)][3];
            // var fromJointsList = new List<list<float>>();
            // var toJointsList = new List<list<float>>();
            foreach (var it in jointNames.Select((x, i) => new { Value = x, Index = i }))
            {
                var idx = it.Index;
                var jointName = it.Value;
                var fromJoint = fromJoints[jointName];
                // var fromPos = new List<float>() { fromJoint.x, fromJoint.y, fromJoint.z };
                var fromPos = new float[] { fromJoint.x, fromJoint.y, fromJoint.z };
                // fromJointsList.Add(fromPos);
                fromJointsArr[idx] = fromPos;

                var toJoint = toJoints[jointName];
                // var toPos = new List<float>() { toJoint.x, toJoint.y, toJoint.z };
                var toPos = new float[] { toJoint.x, toJoint.y, toJoint.z };
                // toJointsList.Add(toPos);
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
            var muTo = tojointsNp.mean(0);

            var from0 = fromJointsNp - muFrom;
            var To0 = toJointsNp - muTo;

            var ssFrom = (from0 * from0).sum();
            var ssTo = (to0 * to0).sum();

            // centred Frobenius norm
            var normfrom = np.sqrt(ssFrom);
            var normto = np.sqrt(ssTo);

            // scale to equal (unit) norm
            var from0 = from0 / normfrom;
            var to0 = to0 / normto;

            // optimum rotation matrix of to
            var A = np.dot(from0.T, to0);
            var U, s, Vt = np.linalg.svd(A, full_matrices = False);
            var V = Vt.T;
            var T = np.dot(V, U.T);

            // Make sure we have a rotation
            var detT = np.linalg.det(T);
            V[":, -1"].imul(np.sign(detT));
            s["-1"].imul(np.sign(detT));
            var T = np.dot(V, U.T);

            traceTA = s.sum();

            // Compute optimum scaling of to.
            b = traceTA * normfrom / normto;
            d = 1 - traceTA * traceTA;
            Z = normfrom * traceTA * np.dot(to0, T) + mufrom;

            c = mufrom - b * np.dot(muto, T);

            return List<double[]>(d.GetData<double>(), Z.GetData<double>(), T.GetData<double>(), b.GetData<double>(), c.GetData<double>());
        }

        List<string> jointNames = new List<string> {
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
    }
}