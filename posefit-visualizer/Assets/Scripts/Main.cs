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
        hm1 = new HumanMotion(jsonFilePath: "Assets/Data/sq-1231.json", cylinderPrefab: cylinderPrefab, spherePrefab: spherePrefab);
        hm2 = new HumanMotion(jsonFilePath: "Assets/Data/sq-1228_2.json", cylinderPrefab: cylinderPrefab, spherePrefab: spherePrefab);
    }

    // Update is called once per frame
    void Update()
    {
        hm1.FrameStep();
        hm2.FrameStep();
    }
}
