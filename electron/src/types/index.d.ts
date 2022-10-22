export {};

declare global {
  interface Window {
    log: typeof import('electron-log').functions;
  }
}
