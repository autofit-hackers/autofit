const { ipcRenderer, contextBridge } = require('electron');

export type Channels = 'ipc-example';

contextBridge.exposeInMainWorld('myAPI', {
  openFile: async () => ipcRenderer.invoke('open-file'),
  saveFile: async () => {
    const data = 'Hello woooooorld!';
    await ipcRenderer.invoke('save-txt', data);
  },
});
