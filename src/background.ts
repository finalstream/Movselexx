"use strict";

import { app, protocol, BrowserWindow } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";
import { ipcMain } from "electron";
import electronDevtoolsInstaller from "electron-devtools-installer";
import AppStore from "firx/AppStore";
import DatabaseAccessor from "./models/DatabaseAccessor";
import MpcService from "./models/MpcService";
import PlayInfo from "./models/PlayInfo";
import LibraryService from './models/LibraryService';
import PlayItem from './models/PlayItem';
import NotificationService from './models/NotificationService';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

let mpcService: MpcService;
let libraryService: LibraryService;
let notificationService: NotificationService;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  // Create the browser window
  win = new BrowserWindow({
    x: AppStore.instance.get("window.x"),
    y: AppStore.instance.get("window.y"),
    width: AppStore.instance.get("window.width", 800),
    height: AppStore.instance.get("window.height", 600),
    frame: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: (process.env
        .ELECTRON_NODE_INTEGRATION as unknown) as boolean,
      //nodeIntegration: true,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    await win.loadURL("app://./index.html");
  }

  win.on("closed", () => {
    win = null;
  });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

ipcMain.handle("initialize", () => {
  const dba = new DatabaseAccessor("movselex.db");
  dba.open();
  libraryService = new LibraryService(dba, new NotificationService(win!.webContents));
});

ipcMain.handle("getLibrary", () => {
  return libraryService.getLibrary();
});

ipcMain.handle("setStore", (event, data) => {
  AppStore.instance.set(data);
});

ipcMain.handle("getStore", (event, key) => {
  return AppStore.instance.get(key);
});

ipcMain.handle("closeWindow", () => {
  AppStore.instance.set("window.x", win!.getPosition()[0]);
  AppStore.instance.set("window.y", win!.getPosition()[1]);
  AppStore.instance.set("window.height", win!.getSize()[1]);
  AppStore.instance.set("window.width", win!.getSize()[0]);
  win!.destroy(); // close()では閉じられない
});

ipcMain.handle("minimizeWindow", () => {
  win?.minimize();
});

ipcMain.handle("maximizeWindow", () => {
  win?.isMaximized() ? win?.unmaximize() : win?.maximize();
});

ipcMain.handle("mpcConnect", (event, connectInfo: any) => {
  mpcService = new MpcService(connectInfo.host, connectInfo.port);
});

ipcMain.handle("mpcGetPlayInfo", async () => {
  const pv = await mpcService.getPlayInfo();
  const playInfo = new PlayInfo();
  playInfo.file = pv.file;
  playInfo.duration = pv.duration;
  playInfo.position = pv.position;
  playInfo.durationString = pv.durationstring;
  playInfo.positionString = pv.positionstring;
  return playInfo;
});

ipcMain.handle("mpcOpenFile", (event, filePath: string) => {
  mpcService.openFile(filePath);
});

ipcMain.handle("mpcSaveScreenShot", (event) => {
  mpcService.saveScreenShot();
});

ipcMain.handle("updateLibrary", (event, playItems: PlayItem[]) => {
  libraryService.updateLibrary(playItems);
});