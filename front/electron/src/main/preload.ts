import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
});

contextBridge.exposeInMainWorld('myAPI', {
  openFile: async () => ipcRenderer.invoke('open-file'),
  openTxtFile: async () => ipcRenderer.invoke('open-txt-file'),
  saveFile: async () => {
    const data = 'Hello woooooorld!';
    await ipcRenderer.invoke('save-txt', data);
  },
  saveMessageFile: async (message: string) => {
    await ipcRenderer.invoke('save-message-txt', message, 'text_save_test');
  },
  saveVideo: async (videoBlob: any, fileName: string) => {
    await ipcRenderer.invoke('save-video', videoBlob, fileName);
  },
  saveVideoFromUrl: async (videoUrl: string, fileName: string) => {
    await ipcRenderer.invoke('save-video-from-url', videoUrl, fileName);
  },
});
