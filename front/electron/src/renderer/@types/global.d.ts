declare global {
  interface Window {
    myAPI: IMyAPI;
  }
}
export interface IMyAPI {
  sendMessage: (message: string) => void;
  onReceiveMessage: (listener: (message: string) => void) => () => void;
  openFile: () => Promise<void>;
  openTxtFile: () => Promise<string>;
  saveFile: () => Promise<void>;
  saveMessageFile: (message: string) => Promise<void>;
  saveVideo: (videoBlob: any, fileName: string) => Promise<void>;
  saveVideoFromUrl: (videoUrl: string, fileName: string) => Promise<void>;
}
