# posefit-streamlit-example

## Prerequisite
* python 3.8.13
```
$ pip install -r requirements.txt
```

## Demo (Recommended)
```
$ streamlit run streamlit_app.py
```
> :warning: ブラウザからローカルに立てたサーバに接続する際に、カメラの使用を許可しないと動作しない

## Resources
* [カメラキャリブレーションのサンプル用画像・動画](https://drive.google.com/drive/folders/1r3Z7lHwwfGPrODKtyt3r8PVc50vcdApI?usp=sharing)

## データベース構造
```
session_info = {
    "session_path": "data/date_name",
    "camera_info_path": "/cameras/date",
    "created_at": "YYMMDD",
    "user_name": "TaroYamada",
}
```

```
./data/<session_name>
├── video
│   ├── front.mp4
│   └── side.mp4
├── pose
│   ├── front.pkl
│   └── side.pkl
└── session_info.json
```


```
camera_info = {
    "camera_info_path": "/cameras/date",
    "camera-names": {"front": "name-1", "side": "name-2"}
    "created_at": "YY-MM~"
    "used_in": ["session_path"]
}
```

```
./camera_info/<datetime>
├── front
    |---imgs/
│   ├── mtx.dat
│   └── dist.dat
├── side
|   |---imgs/
│   ├── mtx.dat
│   └── dist.dat
└── camera_info.json
```


```
./user_info
├── body_info
│   ├── skeleton
│   ├── flexibility
│   └── muscle
└── purpose
```