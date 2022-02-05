using System;
using System.IO;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SoundManager : MonoBehaviour
{
    public List<AudioClip> audioClips;
    public AudioClip currentClip;
    public AudioSource source;
    public GameObject obj;
    
    void Start()
    {
        source = obj.GetComponent<AudioSource>();
    }

    public void PlaySoundEffect()
    {
        var randomizer = new System.Random();
        currentClip = audioClips[randomizer.Next(0, audioClips.Count)];
        source.clip = currentClip;
        source.PlayOneShot(currentClip);
    }
    
    void Awake()
    {
        AudioSource source = obj.GetComponent<AudioSource>();
        //Resources.Loadでサウンドをロード ()内は画像名をパスから指定
        source.clip = Resources.Load<AudioClip>("./Assets/Audio/ShoulderPress/top.wav");
        source.Play();
    }
}