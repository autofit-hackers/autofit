import { Howl } from 'howler';

export const playTrainingStartSound = (playSound = true) => {
  if (playSound) {
    const sound = new Howl({
      src: ['../../resources/audio/start_training.wav'],
      volume: 0.5,
    });
    sound.play();
  }
};

export const playTrainingEndSound = (playSound = true) => {
  if (playSound) {
    const sound = new Howl({
      src: ['../../resources/audio/finish_training.wav'],
      volume: 0.5,
    });
    sound.play();
  }
};

export const playRepCountSound = (repCount: number, playSound = true) => {
  if (playSound) {
    const sound: Howl = new Howl({
      src: [`../../resources/audio/repcount/${repCount}.mp3`],
    });
    sound.play();
  }
};
