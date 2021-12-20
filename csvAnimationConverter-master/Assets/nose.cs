using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using Newtonsoft.Json;
// using System.Text.Json;
// using System.Text.Json.Serialization;
// using System.Web.Script;
// .Serialization;
// unko

class Joint
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Z { get; set; }
}

class nose : MonoBehaviour
{
    // Start is called before the first frame update

    public int frameCount = 0;
    public int frameCountMax;
    public int loopCount = 0;
    public List<int> targetJointIndices = new List<int>() {0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28};
    public List<Dictionary<int, Joint>> deserializedFrames = new List<Dictionary<int, Joint>>();
    public List<Transform> myTransforms = new List<Transform>(33);
    // public List<int> targetJointIndices2 = new List<int>() {0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28};
    // public List<Dictionary<int, Joint>> deserializedFrames2 = new List<Dictionary<int, Joint>>();
    // public List<Transform> myTransforms2 = new List<Transform>(32);
    public float timeOut = 0.05f;
    private float timeElapsed = 0.0f;

    void Start() {
        // deserializedFramesに各行をparseして格納
        var lines = System.IO.File.ReadLines(@"./wide.json");
        foreach (string line in lines) {
            Dictionary<int, Joint> deserializedFrame = JsonConvert.DeserializeObject<Dictionary<int, Joint>>(line);
            deserializedFrames.Add(deserializedFrame);
            Debug.Log(deserializedFrame);
        }
        frameCountMax = deserializedFrames.Count;
    }

    // Update is called once per frame
    void Update()
    {
        

        Debug.Log(Time.deltaTime);
        Debug.Log(timeElapsed);
        Debug.Log(timeElapsed >= timeOut);
        //以下FPS関連
        timeElapsed += Time.deltaTime;
        //FPSを制御
        if(timeElapsed >= 0.05f) {//この中でアニメーション描画
            Dictionary<int, Joint> deserializedFrame = deserializedFrames[frameCount];

            // 各関節点の座標を取得
            // foreach(int jointIdx in targetJointIndices) {
            foreach(KeyValuePair<int, Joint> jointItem in deserializedFrame) {
                int jointIdx = jointItem.Key;
                Joint joint = jointItem.Value;
                // Joint joint = deserializedFrame[jointIdx];
                Transform myTransform = myTransforms[jointIdx];
                Vector3 pos = myTransform.position;
            
                //Debug.Log(joint.X); // , joint.Y, joint.Z);
                pos.y = - ((joint.X-250) / 100);
                pos.x = (joint.Y-165.2f) / 100;
                pos.z = joint.X / 100;
                myTransform.position = pos; // 各座標に直接値を代入することはできない
            }

            // カウンタをインクリメント
            frameCount += 1;

            // 最終フレームに到達した時の処理
            if (frameCount == frameCountMax) {
                frameCount = 0;
                loopCount += 1;
                if (loopCount == 100)
                {
                    UnityEditor.EditorApplication.isPlaying = false; //開発環境での停止トリガ
                    // UnityEngine.Application.Quit(); // 本番環境（スタンドアロン）で実行している場合
                } 
            }            
            
            Debug.Log(timeElapsed);
            Debug.Log("I'm happy!!");

            timeElapsed = 0.0f;
        }
        
    }
}



// "23":{"x":91.858306884765625,"y":261.29248046875,"z":-263.82925415039062}
// "24":{"x":472.713134765625,"y":126.41192626953125,"z":31.6092529296875}
/*
{"3":{"x":356.00177001953125,"y":211.40365600585938,"z":10.218101501464844},
"12":{"x":71.840682983398438,"y":150.40179443359375,"z":18.451156616210938},
"21":{"x":91.619880676269531,"y":79.938629150390625,"z":-217.94439697265625},
"4":{"x":358.11886596679688,"y":141.33016967773438,"z":17.301300048828125},
"30":{"x":125.12059020996094,"y":128.04437255859375,"z":34.616119384765625},
"13":{"x":67.679985046386719,"y":156.681884765625,"z":-65.986137390136719},
"5":{"x":109.00644683837891,"y":259.48345947265625,"z":-233.8114013671875},
"22":{"x":253.120361328125,"y":201.21870422363281,"z":2.200157642364502},
"6":{"x":68.075851440429688,"y":152.80050659179688,"z":-65.935096740722656},
"31":{"x":448.06515502929688,"y":204.60664367675781,"z":127.92036437988281},
"23":{"x":91.858306884765625,"y":261.29248046875,"z":-263.82925415039062},
"32":{"x":122.72425079345703,"y":209.75971984863281,"z":39.219436645507812},
"15":{"x":67.676856994628906,"y":160.60552978515625,"z":-66.051239013671875},
"8":{"x":447.042236328125,"y":140.78182983398438,"z":129.824951171875},
"9":{"x":155.10748291015625,"y":252.72705078125,"z":-81.88397216796875},
"24":{"x":472.713134765625,"y":126.41192626953125,"z":31.6092529296875},
"16":{"x":72.096778869628906,"y":181.997802734375,"z":12.620290756225586},
"25":{"x":470.96575927734375,"y":225.52290344238281,"z":26.820705413818359},
"17":{"x":68.51025390625,"y":177.64315795898438,"z":-67.167953491210938},
"26":{"x":257.197509765625,"y":148.49099731445312,"z":-2.5445373058319092},
"18":{"x":68.18682861328125,"y":171.3192138671875,"z":-67.213844299316406},
"27":{"x":68.376220703125,"y":175.09260559082031,"z":-67.202896118164062},
"19":{"x":96.307655334472656,"y":253.466064453125,"z":-235.67111206054688},
"28":{"x":84.514045715332031,"y":171.20259094238281,"z":-53.412925720214844},
"29":{"x":106.31938934326172,"y":75.85455322265625,"z":-217.77532958984375},
"20":{"x":88.28436279296875,"y":75.7840576171875,"z":-231.46681213378906}}
"14":{"x":90.603607177734375,"y":72.194671630859375,"z":-241.30076599121094},
"7":{"x":161.96806335449219,"y":83.934814453125,"z":-80.703468322753906},
"10":{"x":442.78009033203125,"y":134.26702880859375,"z":124.12334442138672},
"0":{"x":76.438751220703125,"y":166.57829284667969,"z":-82.177215576171875},
"1":{"x":85.275566101074219,"y":158.56736755371094,"z":-51.263027191162109},
"11":{"x":90.96685791015625,"y":255.27447509765625,"z":-253.9564208984375},
"2":{"x":437.73001098632812,"y":209.28909301757812,"z":121.96324157714844},

*/