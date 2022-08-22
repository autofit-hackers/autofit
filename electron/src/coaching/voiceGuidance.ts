import { Howl } from 'howler';

export const playTrainingStartSound = () => {
  const sound = new Howl({
    src: ['../../resources/audio/start_train.wav'],
    volume: 0.5,
  });
  sound.play();
};

export const playRepCountSound = (repCount: number) => {
  const sound: Howl = new Howl({
    src: [`../../resources/audio/repcount/${repCount}.mp3`],
  });
  sound.play();
};
