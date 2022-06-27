const { ipcRenderer, contextBridge } = require('electron');

export type Channels = 'ipc-example';

contextBridge.exposeInMainWorld('myAPI', {
  openFile: async () => ipcRenderer.invoke('open-file'),
  openTxtFile: async () => {
    const { canceled, data } = await ipcRenderer.invoke('open-txt-file');
    if (canceled) return;
    // eslint-disable-next-line consistent-return
    return data;
  },
  saveFile: async () => {
    const data = 'Hello woooooorld!';
    await ipcRenderer.invoke('save-txt', data);
  },
  saveMessageFile: async (message: string) => {
    await ipcRenderer.invoke('save-message-txt', message);
  },
});
