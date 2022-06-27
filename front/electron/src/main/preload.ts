// import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// export type Channels = 'ipc-example';

// contextBridge.exposeInMainWorld('electron', {
//   ipcRenderer: {
//     sendMessage(channel: Channels, args: unknown[]) {
//       ipcRenderer.send(channel, args);
//     },
//     on(channel: Channels, func: (...args: unknown[]) => void) {
//       const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
//         func(...args);
//       ipcRenderer.on(channel, subscription);

//       return () => ipcRenderer.removeListener(channel, subscription);
//     },
//     once(channel: Channels, func: (...args: unknown[]) => void) {
//       ipcRenderer.once(channel, (_event, ...args) => func(...args));
//     },
//   },
// });

const { ipcRenderer, contextBridge } = require('electron');

export type Channels = 'ipc-example';

contextBridge.exposeInMainWorld('myAPI', {
  openDialog: async () => ipcRenderer.invoke('open-dialog'),
  openFile: async () => {
    console.log('###############################################');
    // const { canceled, data } =
    await ipcRenderer.invoke('open-file');
    console.log('###############################################');
    // if (canceled) return;
    // {document.querySelector('#text') as }.value = data[0] || '';
  },
  saveFile: async () => {
    const data = 'Hello woooooorld!';
    await ipcRenderer.invoke('save', data);
  },
});
