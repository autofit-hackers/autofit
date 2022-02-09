using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace DisplayObjects2DNs
{
    /*
     * Reps
     * Menu Name
     * Heart Rate
     * Advice Comment
     * Cheer Up Comment
     * Etc
     */
    struct DisplayObjectsState
    {
        public RepCounterState repCounterState;
    }

    struct DisplayObjectsSettings
    {
        public RepCounterSettings repCounterSettings;
    }
    
    struct RepCounterState
    {
        public bool flag;
        public int repCount;
        public GameObject countTextObject;
    }
    
    struct RepCounterSettings
    {
        public int keyJointNumber;
        public string menuName;
        public float upperThreshold;
        public float lowerThreshold;
        public bool isLiftUpType;
        public int directionIndex; // means lift up direction related to screen rotation => x: 0, y: 1
    }
    
    class DisplayObjects
    {
        public RepCounterState repCounterState;
        public RepCounterSettings repCounterSettings;
        
        public AudioClip audioClip;
        private AudioSource audioSource;

        private Vector2 screenSize = new Vector2(1080, 1920);

        public DisplayObjects(
            GameObject countTextObject
        )
        {
            repCounterState = new RepCounterState()
            {
                flag = false,
                repCount = 0,
                countTextObject = countTextObject
            };
            repCounterSettings = new RepCounterSettings()
            {
                keyJointNumber = 16,
                menuName = "squat",
                upperThreshold = 0.4f,
                lowerThreshold = 0.5f,
                isLiftUpType = true,
                directionIndex = 1
            };
        }

        public void Preprocess(Camera mainCamera)
        {
            repCounterState.countTextObject.transform.position =
                mainCamera.ScreenToWorldPoint(new Vector3(200, screenSize.y - 200 - 5, 100));
            ResetRepCounts();
        }

        public void Update(Dictionary<string, GameObject> jointObjects)
        {
            UpdateRepCounts(jointObjects);
        }

        public void ResetRepCounts()
        {
            repCounterState.repCount = 0;
            repCounterState.countTextObject.GetComponent<Text>().text = repCounterState.repCount.ToString();
        }

        public void UpdateRepCounts(Dictionary<string, GameObject> jointObjects)
        {
            if (repCounterSettings.isLiftUpType)
            {
                if (!repCounterState.flag &&
                    jointObjects[PoseLandmarks.LANDMARK_LIST[repCounterSettings.keyJointNumber]].transform
                        .position[repCounterSettings.directionIndex] < repCounterSettings.upperThreshold)
                    repCounterState.flag = true;
                if (repCounterState.flag &&
                    jointObjects[PoseLandmarks.LANDMARK_LIST[repCounterSettings.keyJointNumber]].transform
                        .position[repCounterSettings.directionIndex] > repCounterSettings.lowerThreshold)
                {
                    repCounterState.flag = false;
                    repCounterState.repCount++;
                    repCounterState.countTextObject.GetComponent<Text>().text = repCounterState.repCount.ToString();
                    // audioSource.Play();
                }
            }
            else
            {
                if (!repCounterState.flag &&
                    jointObjects[PoseLandmarks.LandMarks[repCounterSettings.keyJointNumber]].transform
                        .position[repCounterSettings.directionIndex] > repCounterSettings.lowerThreshold)
                    repCounterState.flag = true;
                if (repCounterState.flag &&
                    jointObjects[PoseLandmarks.LandMarks[repCounterSettings.keyJointNumber]].transform
                        .position[repCounterSettings.directionIndex] < repCounterSettings.upperThreshold)
                {
                    repCounterState.flag = false;
                    repCounterState.repCount++;
                    repCounterState.countTextObject.GetComponent<Text>().text = repCounterState.repCount.ToString();
                    // audioSource.Play();
                }
            }
        }
    }
}
