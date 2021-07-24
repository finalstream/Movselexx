import electron, { app } from "electron";
import { IPlayItem } from "./IPlayItem";
import MovselexxAppStore from "./MovselexxAppStore";
import PlayInfo from "./PlayInfo";
import PlayItem from "./PlayItem";

export default class MpcClient {
  private ipcRenderer = electron.ipcRenderer;
  private _host: string;
  private _port: number;
  private _isBootMpc: boolean;
  private _appStore: MovselexxAppStore;

  constructor(appStore: MovselexxAppStore, host: string, port: number) {
    this._appStore = appStore;
    this._host = host;
    this._port = port;
    this._isBootMpc = false;
  }

  async connect(): Promise<boolean> {
    return await this.ipcRenderer.invoke("mpcConnect", {
      host: this._host,
      port: this._port,
    });
  }

  countupPlay(id: number) {
    this.ipcRenderer.invoke("countupPlay", id);
  }

  async getPlayInfo(): Promise<PlayInfo> {
    const pi: PlayInfo = await this.ipcRenderer.invoke("mpcGetPlayInfo");
    if (pi == null) {
      this._isBootMpc = false;
    } else {
      this._isBootMpc = true;
      const library: IPlayItem = await this.ipcRenderer.invoke("getLibrary", pi.filepath);
      if (library) {
        pi.library = new PlayItem(library);
      }
    }

    return pi;
  }

  async bootMpc() {
    await this.ipcRenderer.invoke(
      "mpcBoot",
      this._appStore.mpcExePath,
      this._appStore.playDisplayNo
    );
  }

  async resumePlay() {
    await this.bootMpc();
    await this.ipcRenderer.invoke("mpcResumePlay");
  }

  async openFile(filePath: string, isFullScreen: boolean) {
    console.log("mpcOpenFile", filePath, isFullScreen);
    if (!this.isBootMpc()) {
      await this.bootMpc();
      isFullScreen = true;
    }
    return this.ipcRenderer.invoke("mpcOpenFile", filePath, isFullScreen);
  }

  async toggleMute() {
    await this.ipcRenderer.invoke("mpcToggleMute");
  }

  saveScreenShot() {
    return this.ipcRenderer.invoke("mpcSaveScreenShot");
  }

  isBootMpc() {
    return this._isBootMpc;
  }
}
