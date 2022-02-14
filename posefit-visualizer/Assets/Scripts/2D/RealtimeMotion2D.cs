using System;
using System.Collections;
using System.Collections.Generic;
using BoneOrdinals2DNs;
using UnityEngine;
using Mediapipe.BlazePose;
using UnityEngine.UI;


namespace RealtimeMotion2DNs
{
    struct RealtimeMotionSettings
    {
        public Transform cylinderPrefab;
        public Transform spherePrefab;
        public Color jointColor;
        public float lpfRate;
        public float sphereScale;
        public Vector3 scale;
        public Vector3 rotation;
        public Vector3 translation;
    }

    struct RealtimeMotionState
    {
        public Dictionary<string, GameObject> jointGameObjects; // spheres
        public Dictionary<string, GameObject> boneGameObjects; // cylinders
        
        public BlazePoseDetecter detecter;
        public Vector4[] data;
        public WebCamInput webCamInput;
        public RawImage inputImageUI;
        public BlazePoseResource blazePoseResource;
        public BlazePoseModel poseLandmarkModel;
    }

    class RealtimeMotion2D
    {
        public RealtimeMotionSettings settings;
        public RealtimeMotionState state;

        public RealtimeMotion2D(
            Transform cylinderPrefab,
            Transform spherePrefab,
            Color jointColor,
            WebCamInput webCamInput,
            ref RawImage inputImageUI,
            BlazePoseResource blazePoseResource,
            BlazePoseModel poseLandmarkModel
        )
        {
            settings = new RealtimeMotionSettings()
            {
                cylinderPrefab = cylinderPrefab,
                spherePrefab = spherePrefab,
                jointColor = jointColor,
                lpfRate = 0.4f,
                sphereScale = 1.5f,
                scale = new Vector3(1920, 1080, 1),
                rotation = new Vector3(1,1,1),
                translation = new Vector3(0, -5,0)
                
            };
            state = new RealtimeMotionState()
            {
                jointGameObjects = new Dictionary<string, GameObject>(),
                boneGameObjects = new Dictionary<string, GameObject>(),
                
                data = new Vector4[33],
                webCamInput = webCamInput,
                inputImageUI = inputImageUI,
                blazePoseResource = blazePoseResource,
                poseLandmarkModel = poseLandmarkModel
            };
        }
        
        // Initialize GameObjects
        public void Preprocess()
        {
            state.detecter = new BlazePoseDetecter(state.blazePoseResource, state.poseLandmarkModel);
            
            // Initialize joint objects
            foreach (var jointName in PoseLandmarks.LANDMARK_LIST)
            {
                state.jointGameObjects[jointName] = GameObject.Instantiate(settings.spherePrefab.gameObject, Vector3.zero, Quaternion.identity) as GameObject;
                state.jointGameObjects[jointName].transform.localScale = new Vector3(settings.sphereScale, settings.sphereScale, settings.sphereScale);
                state.jointGameObjects[jointName].GetComponent<Renderer>().material.color = settings.jointColor;
            }

            //　Initialize bone objects
            foreach (KeyValuePair<string, (string, string)> boneEdgeName in BoneOrdinals2D.boneEdgeNames)
            {
                string boneName = boneEdgeName.Key;
                string startJointName = boneEdgeName.Value.Item1;
                string endJointName = boneEdgeName.Value.Item2;
                InstantiateCylinder(
                    boneName,
                    settings.cylinderPrefab,
                    state.jointGameObjects[startJointName].transform.position,
                    state.jointGameObjects[endJointName].transform.position,
                    state.boneGameObjects
                );
                state.boneGameObjects[boneName].GetComponent<Renderer>().material.color = settings.jointColor;
            }
        }
        
        // Update frame
        public void UpdateFrame(Camera mainCamera)
        {
            state.inputImageUI.texture = state.webCamInput.inputImageTexture;
            GetData();
            UpdateGameObjects(mainCamera, state.data,state.jointGameObjects, state.boneGameObjects);
        }

        public void GetData()
        {
            state.detecter.ProcessImage(state.webCamInput.inputImageTexture, state.poseLandmarkModel);
            ComputeBuffer result = state.detecter.outputBuffer;
            ComputeBuffer worldLandmarkResult = state.detecter.worldLandmarkBuffer;
            result.GetData(state.data);
        }

        // Update GameObjects
        public void UpdateGameObjects(Camera mainCamera, Vector4[] data, Dictionary<string, GameObject> joints, Dictionary<string, GameObject> bones)
        {
            // joint GameObject の update
            for (int jointNumber = 0; jointNumber < 33; jointNumber++)
            {
                var lastPositionVec = joints[PoseLandmarks.LANDMARK_LIST[jointNumber]].transform.position;
                // var newPositonVec = mainCamera.ScreenToWorldPoint(new Vector3(data[jointNumber].x*settings.scale.x, (1-data[jointNumber].y)*settings.scale.y, 95)) + settings.translation;
                var newPositonVec =
                    mainCamera.ScreenToWorldPoint(new Vector3((1 - data[jointNumber].y) * settings.scale.y,
                        (1 - data[jointNumber].x) * settings.scale.x, data[jointNumber].z*100 +95)) + new Vector3(0,-5f*1080/1920,0); //TODO: ここでZ座標を出現させる
                var vec = lastPositionVec * (1-settings.lpfRate) + newPositonVec * settings.lpfRate;
                joints[PoseLandmarks.LANDMARK_LIST[jointNumber]].transform.position = vec;
            }

            // bones の update
            foreach (KeyValuePair<string, (string, string)> boneEdgeName in BoneOrdinals2D.boneEdgeNames)
            {
                string boneName = boneEdgeName.Key;
                string startJointName = boneEdgeName.Value.Item1;
                string endJointName = boneEdgeName.Value.Item2;
                UpdateCylinderPosition(
                    bones[boneName],
                    joints[startJointName].transform.position,
                    joints[endJointName].transform.position
                );
            }
        }
        
        // Initialize GameObjects
        private void InitializeGameObjects(Dictionary<string, GameObject> joints, Dictionary<string, GameObject> bones, Color color)
        {
            foreach (var jointName in PoseLandmarks.LANDMARK_LIST) // Initialize JointObjects
            {
                joints[jointName] =
                    GameObject.Instantiate(settings.spherePrefab.gameObject, Vector3.zero, Quaternion.identity);
                joints[jointName].transform.localScale =
                    new Vector3(settings.sphereScale, settings.sphereScale, settings.sphereScale);
                joints[jointName].GetComponent<Renderer>().material.color = color;
            }

            foreach (KeyValuePair<string, (string, string)> boneEdgeName in BoneOrdinals2D.boneEdgeNames) // Initialize BoneObjects
            {
                string boneName = boneEdgeName.Key;
                string startJointName = boneEdgeName.Value.Item1;
                string endJointName = boneEdgeName.Value.Item2;
                InstantiateCylinder(
                    boneName,
                    settings.cylinderPrefab,
                    joints[startJointName].transform.position,
                    joints[endJointName].transform.position,
                    bones
                );
                bones[boneName].GetComponent<Renderer>().material.color = color;
            }
        }
        
        // Initialize Cylinder
        private void InstantiateCylinder(String key, Transform cylinderPrefab, Vector3 beginPoint, Vector3 endPoint,
            Dictionary<string, GameObject> bones)
        {
            bones[key] = GameObject.Instantiate(cylinderPrefab.gameObject, Vector3.zero, Quaternion.identity);
            UpdateCylinderPosition(bones[key], beginPoint, endPoint);
        }

        // Update Cylinder
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

        public void Dispose()
        {
            // Must call Dispose method when no longer in use.
            state.detecter.Dispose();
        }

        public Dictionary<string, Vector3> CaluculateOneJointFrame()
        {
            Dictionary<string, Vector3> frame = new Dictionary<string, Vector3>();
            for (int jointNumber = 0; jointNumber < 33; jointNumber++)
            {
                var positonVec = state.jointGameObjects[PoseLandmarks.LANDMARK_LIST[jointNumber]].transform.position;
                frame[PoseLandmarks.LANDMARK_LIST[jointNumber]] = positonVec;
            }
            return frame;
        }
    }
}
