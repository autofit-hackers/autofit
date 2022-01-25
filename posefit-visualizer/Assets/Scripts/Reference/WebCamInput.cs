using UnityEngine;

public class WebCamInput : MonoBehaviour
{
    [SerializeField] string webCamName;
    [SerializeField] Vector2 webCamResolution = new Vector2(1920, 1080);
    [SerializeField] Texture staticInput;
    public int deviceId = 0;
    public int fps = 30;

    // Provide input image Texture.
    public Texture inputImageTexture{
        get{
            if(staticInput != null) return staticInput;
            return inputRT;
        }
    }

    WebCamTexture webCamTexture;
    RenderTexture inputRT;

    void Start()
    {
        if(staticInput == null){
            WebCamDevice[] devices = WebCamTexture.devices;
            webCamTexture = new WebCamTexture(devices[deviceId].name, (int)webCamResolution.x, (int)webCamResolution.y, fps);
            webCamTexture.Play();
        }

        inputRT = new RenderTexture((int)webCamResolution.x, (int)webCamResolution.y, 0);
    }

    void Update()
    {
        if(staticInput != null) return;
        if(!webCamTexture.didUpdateThisFrame) return;

        var aspect1 = (float)webCamTexture.width / webCamTexture.height;
        var aspect2 = (float)inputRT.width / inputRT.height;
        var aspectGap = aspect2 / aspect1;

        var vMirrored = true;//webCamTexture.videoVerticallyMirrored;
        // var scale = new Vector2(aspectGap, vMirrored ? -1 : 1);
        // var offset = new Vector2((1 - aspectGap) / 2, vMirrored ? 1 : 0);
        var scale = new Vector2(-aspectGap, vMirrored ? -1 : 1);
        var offset = new Vector2(1, vMirrored ? 1 : 0);

        Graphics.Blit(webCamTexture, inputRT, scale, offset);
    }

    void OnDestroy(){
        if (webCamTexture != null) Destroy(webCamTexture);
        if (inputRT != null) Destroy(inputRT);
    }
}
