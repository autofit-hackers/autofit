from gtts import gTTS

for i in range(30):
    myText = f"{i+1}"
    language = "ja"
    output = gTTS(text=myText, lang=language, slow=False)
    output.save(f"../electron/resources/audio/repcount/{i+1}.mp3")
    print(f"{i} is finished")
