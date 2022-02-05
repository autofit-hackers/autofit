// ref. https://qiita.com/ZeniZeni/items/cb87de61b9830e7442dc
using System;
using System.Text;
using UnityEngine;
using UnityEngine.Windows.Speech;


public class KeywordController : MonoBehaviour{

    public string[][] keywords;//認識したい単語を二次元配列で記録
    public bool[] hasRecognized;
    public KeywordRecognizer[] m_Recognizer;
    public bool ConsoleKeyword;//認識された単語をコンソールで表示するかしないか

    public KeywordController(string[][] keywords,bool ConsoleKeyword)
    {
        this.ConsoleKeyword = ConsoleKeyword;
        this.keywords = keywords;
    }

    public void SetKeywords()
    {
        hasRecognized = new bool[keywords.Length];
        m_Recognizer = new KeywordRecognizer[keywords.Length];
        for (int i = 0; i < keywords.Length; i++)
        {
            SetRecognizer(i);
        }
    }

    private void SetRecognizer(int i)
    {
        m_Recognizer[i] = new KeywordRecognizer(keywords[i]);
        m_Recognizer[i].OnPhraseRecognized += SetKeywordsBool;
        if (ConsoleKeyword)
        {
            m_Recognizer[i].OnPhraseRecognized += OnPhraseRecognized;
        }
    }

    private void SetKeywordsBool(PhraseRecognizedEventArgs args)
    {
        for (int i = 0; i < keywords.Length; i++)
        {
            for (int j = 0; j < keywords[i].Length; j++)
            {
                if (args.text == keywords[i][j])
                {
                    hasRecognized[i] = true;
                }
            }
        }
    }

    public void StartRecognizing(int i)
    {
        if (!m_Recognizer[i].IsRunning)
        {
            m_Recognizer[i].Start();
        }
        else
        {
            Debug.Log("KeywordRecognizer" + "[" + i + "]" + " is already started.");
        }

    }

    public void StopRecognizing(int i)
    {
        if (m_Recognizer[i].IsRunning)
        {
            m_Recognizer[i].Stop();
        }
        else
        {
            Debug.Log("KeywordRecognizer" + "[" + i + "]" + " is already stopped.");
        }
    }

    private void OnPhraseRecognized(PhraseRecognizedEventArgs args)
    {
        StringBuilder builder = new StringBuilder();
        builder.AppendFormat("{0} ({1}){2}", args.text, args.confidence, Environment.NewLine);
        builder.AppendFormat("\tTimestamp: {0}{1}", args.phraseStartTime, Environment.NewLine);
        builder.AppendFormat("\tDuration: {0} seconds{1}", args.phraseDuration.TotalSeconds, Environment.NewLine);
        Debug.Log(builder.ToString());
    }
}