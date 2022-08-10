const playRepCountSound = (repCount: number): void => {
  // ブラウザにWeb Speech API Speech Synthesis機能があるか判定
  if ('speechSynthesis' in window) {
    // 発言を設定
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = `${repCount}`;
    // 発言を再生
    window.speechSynthesis.speak(utterance);
  } else {
    alert('このブラウザは音声合成に対応していません。');
  }
};

export default playRepCountSound;
