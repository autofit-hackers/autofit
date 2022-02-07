using System.Collections;
using System.Collections.Generic;
using JetBrains.Annotations;
using OpenCVForUnity.ArucoModule;
using UnityEngine;

/**
 * List according to 
 * Assets/Scenes/BlazePose/pose-landmarks-map.png
 */
public static class PoseLandmarks {

    public const int NOSE = 0;

    public const int LEFT_EYE_INNER = 1;
    public const int LEFT_EYE = 2;
    public const int LEFT_EYE_OUTER = 3;

    public const int RIGHT_EYE_INNER = 4;
    public const int RIGHT_EYE = 5;
    public const int RIGHT_EYE_OUTER = 6;

    public const int LEFT_EAR = 7;
    public const int RIGHT_EAR = 8;

    public const int LEFT_MOUTH = 9;
    public const int RIGHT_MOUTH = 10;

    public const int LEFT_SHOULDER = 11;
    public const int RIGHT_SHOULDER = 12;

    public const int LEFT_ELBOW = 13;
    public const int RIGHT_ELBOW = 14;

    public const int LEFT_WRIST = 15;
    public const int RIGHT_WRIST = 16;

    public const int LEFT_PINKY = 17;
    public const int RIGHT_PINKY = 18;

    public const int LEFT_INDEX = 19;
    public const int RIGHT_INDEX = 20;

    public const int LEFT_THUMB = 21;
    public const int RIGHT_THUMB = 22;

    public const int LEFT_HIP = 23;
    public const int RIGHT_HIP = 24;

    public const int LEFT_KNEE = 25;
    public const int RIGHT_KNEE = 26;

    public const int LEFT_ANKLE = 27;
    public const int RIGHT_ANKLE = 28;

    public const int LEFT_HEEL = 29;
    public const int RIGHT_HEEL = 30;

    public const int LEFT_FOOT_INDEX = 31;
    public const int RIGHT_FOOT_INDEX = 32;

    public static readonly Dictionary<int, string> LANDMARKS = new Dictionary<int, string>()
    {
        {0, "Nose"},
        {1, "LeftEyeInner"},
        {2, "LeftEye"},
        {3, "LeftEyeOuter"}
    };
    
    public static readonly Dictionary<int, string> LandMarks = new Dictionary<int, string>()
    {
        {NOSE, "NOSE"},
        {LEFT_EYE_INNER, "LEFT_EYE_INNER"},
        {LEFT_EYE, "LEFT_EYE"},
        {LEFT_EYE_OUTER, "LEFT_EYE_OUTER"},
        {RIGHT_EYE_INNER, "RIGHT_EYE_INNER"},
        {RIGHT_EYE, "RIGHT_EYE"},
        {RIGHT_EYE_OUTER, "RIGHT_EYE_OUTER"},
        {LEFT_EAR, "LEFT_EAR"}
    };

    public static readonly List<string> LANDMARK_LIST = new List<string>()
    {
        "Nose", 
        "LeftEyeInner", 
        "LeftEye",
        "LeftEyeOuter",
        "RightEyeInner", 
        "RightEye",
        "RightEyeOuter",
        "LeftEar",
        "RightEar",
        "LeftMouth",
        "RightMouth",
        "LeftShoulder",
        "RightShoulder",
        "LeftElbow",
        "RightElbow",
        "LeftWrist",
        "RightWrist",
        "LeftPinky",
        "RightPinky",
        "LeftIndex",
        "RightIndex",
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
        "LeftFootIndex",
        "RightFootIndex"
    };

    [CanBeNull] public static readonly List<string> LANDMARK_LIST_NOT_USED = new List<string>()
    {
        "NOSE",
        "LEFT_EYE_INNER",
        "LEFT_EYE",
        "LEFT_EYE_OUTER",
        "RIGHT_EYE_INNER",
        "RIGHT_EYE",
        "RIGHT_EYE_OUTER",
        "LEFT_EAR",
        "RIGHT_EAR",
        "LEFT_MOUTH",
        "RIGHT_MOUTH",
        "LEFT_SHOULDER",
        "RIGHT_SHOULDER",
        "LEFT_ELBOW",
        "RIGHT_ELBOW",
        "LEFT_WRIST",
        "RIGHT_WRIST",
        "LEFT_PINKY",
        "RIGHT_PINKY",
        "LEFT_INDEX",
        "RIGHT_INDEX",
        "LEFT_THUMB",
        "RIGHT_THUMB",
        "LEFT_HIP",
        "RIGHT_HIP",
        "LEFT_KNEE",
        "RIGHT_KNEE",
        "LEFT_ANKLE",
        "RIGHT_ANKLE",
        "LEFT_HEEL",
        "RIGHT_HEEL",
        "LEFT_FOOT_INDEX",
        "RIGHT_FOOT_INDEX"
    };
}