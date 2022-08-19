import { Howl } from 'howler';

const playRepCountSound = (repCount: number) => {
  const sound: Howl = new Howl({
    src: [`../../resources/audio/repcount/${repCount}.mp3`],
  });
  sound.play();
};

export default playRepCountSound;
