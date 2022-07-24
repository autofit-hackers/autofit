const playRepCountSound = (repCount: number): void => {
  // ブラウザにWeb Speech API Speech Synthesis機能があるか判定
  if ('speechSynthesis' in window) {
    // 発言を設定
    const uttr = new SpeechSynthesisUtterance();
    uttr.text = `${repCount}`;
    // 発言を再生
    window.speechSynthesis.speak(uttr);
  } else {
    alert('このブラウザは音声合成に対応していません。');
  }
};

export default playRepCountSound;
