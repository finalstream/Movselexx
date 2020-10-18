import electron from "electron";
import IpcResponse from "firx/IpcResponse";
import PlayInfo from "./PlayInfo";

export default class MpcClient {
  private ipcRenderer = electron.ipcRenderer;
  private _host: string;
  private _port: number;

  constructor(host: string, port: number) {
    this._host = host;
    this._port = port;
  }

  async connect() {
    await this.ipcRenderer.invoke("mpcConnect", {
      host: this._host,
      port: this._port,
    });
  }

  countupPlay(id: number) {
    this.ipcRenderer.invoke("countupPlay", id);
  }

  getPlayInfo(): Promise<PlayInfo> {
    return this.ipcRenderer.invoke("mpcGetPlayInfo");
  }

  openFile(filePath: string, isFullScreen: boolean) {
    this.ipcRenderer.invoke("mpcOpenFile", filePath, isFullScreen);
  }

  saveScreenShot() {
    return this.ipcRenderer.invoke("mpcSaveScreenShot");
  }
}
