const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  close: () => ipcRenderer.invoke("window:close"),
  togglePin: () => ipcRenderer.invoke("window:toggle-pin"),
  isPinned: () => ipcRenderer.invoke("window:is-pinned"),
});
