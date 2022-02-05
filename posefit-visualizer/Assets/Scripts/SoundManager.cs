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

    void Start()
    {
        source = GetComponent<AudioSource>();
    }

    void PlaySoundEffect()
    {
        var randomizer = new System.Random();
        currentClip = audioClips[randomizer.Next(0, audioClips.Count)];
        source.clip = currentClip;
        source.PlayOneShot(currentClip);
    }
}