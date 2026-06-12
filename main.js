const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 214,
    height: 228,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    nodeIntegration: true,
    frame: false,        // keep this — removes the default OS titlebar
    transparent: false,  // keep or set to true if you want a transparent bg
    movable: true,
    webPreferences: {
      contextIsolation: true
    }
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

const { ipcMain } = require('electron');
ipcMain.on('minimize', () => win.minimize());
ipcMain.on('close', () => win.close());