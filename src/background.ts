"use strict";

import { app, protocol, BrowserWindow, dialog, screen } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";
import { ipcMain } from "electron";
import electronDevtoolsInstaller from "electron-devtools-installer";
import AppStore from "firx/AppStore";
import DatabaseAccessor from "./models/DatabaseAccessor";
import MpcService from "./models/MpcService";
import PlayInfo from "./models/PlayInfo";
import LibraryService from "./models/LibraryService";
import PlayItem from "./models/PlayItem";
import NotificationService from "./models/NotificationService";
import PlayingItem from "./models/PlayingItem";
import { RatingType } from "./models/RatingType";

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
      nodeIntegration: (process.env.ELECTRON_NODE_INTEGRATION as unknown) as boolean,
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
    process.on("message", data => {
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
  return screen.getAllDisplays();
});

ipcMain.handle(
  "getLibraries",
  (event, searchKeyword: string, isShuffle: boolean, selectionRating: RatingType) => {
    return libraryService.getLibraries(isShuffle, selectionRating, searchKeyword);
  }
);

ipcMain.handle("getPlayingList", event => {
  return libraryService.getPlayingList();
});

ipcMain.handle("switchRating", (event, id: number, isFavorite: boolean) => {
  return libraryService.switchRating(id, isFavorite);
});

ipcMain.handle("switchPlayed", (event, id: number, isPlayed: boolean) => {
  return libraryService.switchPlayed(id, isPlayed);
});

ipcMain.handle("setStore", (event, key: string, data) => {
  AppStore.instance.set(key, data);
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

ipcMain.handle("getWindowSize", () => {
  return win!.getSize();
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
  let pv;
  try {
    pv = await mpcService.getPlayInfo();
  } catch {
    return null;
  }
  const playInfo = new PlayInfo();
  playInfo.file = pv.file;
  playInfo.filepath = pv.filepath;
  playInfo.state = pv.state;
  playInfo.duration = pv.duration;
  playInfo.position = pv.position;
  playInfo.durationString = pv.durationstring;
  playInfo.positionString = pv.positionstring;

  // ファイルパスからライブラリを取得
  const lib = await libraryService.getLibraryByFilePath(playInfo.filepath);

  if (lib) {
    playInfo.library = lib;
  }

  return playInfo;
});

ipcMain.handle("countupPlay", (event, id: number) => {
  libraryService.countupPlay(id);
});
ipcMain.handle("mpcBoot", async (event, mpcExePath: string, screenNo: number) => {
  await mpcService.boot(mpcExePath, screenNo);
});

ipcMain.handle("mpcOpenFile", (event, filePath: string, isFullScreen: boolean) => {
  mpcService.openFile(filePath, isFullScreen);
});

ipcMain.handle("mpcSaveScreenShot", event => {
  mpcService.saveScreenShot();
});

ipcMain.handle("updatePlayingList", (event, playingItems: PlayingItem[]) => {
  libraryService.updatePlayingList(playingItems);
});

ipcMain.handle("updateLibrary", (event, playItems: PlayItem[]) => {
  libraryService.updateLibrary(playItems);
});

ipcMain.handle("registLibrary", (event, drops: string[]) => {
  libraryService.registDrops(drops);
});

ipcMain.handle("deleteLibrary", (event, isDeleteFile: boolean, deleteItems: PlayItem[]) => {
  libraryService.deleteLibrary(isDeleteFile, deleteItems);
});

ipcMain.handle("openDialogfile", (event, data) => {
  return dialog
    .showOpenDialog(win!, {
      properties: ["openFile"],
      filters: [{ name: "exe file", extensions: ["exe"] }],
    })
    .then(ret => {
      return ret.filePaths[0];
    });
});
