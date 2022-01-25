using System.Collections;
using System.Collections.Generic;
using UnityEngine;
public class WebCamera : MonoBehaviour
{
    public int width = 1920;
    public int height = 1080;
    public int fps = 30;
    public int deviceId = 0;
    WebCamTexture webcamTexture;
    void Start () {
        WebCamDevice[] devices = WebCamTexture.devices;
        webcamTexture = new WebCamTexture(devices[deviceId].name, this.width, this.height, this.fps);
        GetComponent<Renderer> ().material.mainTexture = webcamTexture;
        webcamTexture.Play();
    }
}
