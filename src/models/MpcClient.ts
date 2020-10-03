import electron from "electron";
import IpcResponse from "firx/IpcResponse";

export default class MpcClient {
  private ipcRenderer = electron.ipcRenderer;
  host: string;
  port: number;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  getPlayInfo(): Promise<string> {
    return this.ipcRenderer.invoke("mpcGetPlayInfo");
  }
}
