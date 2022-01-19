using System;
using HumanMotionNs;
using System.Collections.Generic;
using UnityEngine;

class Main : MonoBehaviour
{
    // Start is called before the first frame update
    public Transform cylinderPrefab;
    public Transform spherePrefab;
    // public List<Transform> cylinderPrefabs = new List<Transform>(3);
    // public List<GameObject> cylinders = new List<GameObject>(3);
    // private GameObject cylinder;

    private HumanMotion hm1;
    private HumanMotion hm2;

    void Start()
    {
        string jsonFilePath1 = "./Assets/Data/squat-narrow-20220119.json";
        string jsonFilePath2 = "./Assets/Data/squat-wide-20220119-3.json";
        hm1 = new HumanMotion(jsonFilePath: jsonFilePath1, cylinderPrefab: cylinderPrefab, spherePrefab: spherePrefab, jointColor: Color.cyan);
        hm2 = new HumanMotion(jsonFilePath: jsonFilePath2, cylinderPrefab: cylinderPrefab, spherePrefab: spherePrefab, jointColor: Color.magenta);
        hm1.ReadAndPreprocess();
        hm2.ReadAndPreprocess();
    }

    // Update is called once per frame
    void Update()
    {
        hm1.FrameStep();
        hm2.FrameStep();
    }
}
