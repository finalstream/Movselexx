import electron from "electron";
import IpcResponse from "firx/IpcResponse";
import PlayInfo from "./PlayInfo";

export default class MpcClient {
  private ipcRenderer = electron.ipcRenderer;
  private _host: string;
  private _port: number;
  private _playingId: number;
  private _playPreviousDate: Date | null;
  private _playAccumTimeMs: number;

  constructor(host: string, port: number) {
    this._host = host;
    this._port = port;
    this._playingId = -1;
    this._playPreviousDate = null;
    this._playAccumTimeMs = 0;
  }

  async connect() {
    await this.ipcRenderer.invoke("mpcConnect", {
      host: this._host,
      port: this._port,
    });
  }

  monitoring(pi: PlayInfo) {
    if (pi.library == null) return;
    const nowId = pi.library.ID;

    if (nowId == this._playingId) {
      // 継続再生
      if (this._playPreviousDate == null) {
        // 初回はカウント開始記録だけ(進んだ量がわからないため)
      } else if (pi.state == 2) {
        // 再生中の場合、経過した時間を蓄積する
        const playIncrementalTimeMs = new Date().getTime() - this._playPreviousDate.getTime();
        this._playAccumTimeMs += playIncrementalTimeMs;
        const countUpDurationMs = pi.duration * 0.7;

        console.log("playingId", nowId);
        console.log("playAccumTimeMs", this._playAccumTimeMs);
        console.log("countUpDurationMs", countUpDurationMs);
        if (countUpDurationMs <= this._playAccumTimeMs) {
          // 再生回数をカウントアップする
          this.countupPlay(nowId);
          // 累積時間をリセット
          this._playAccumTimeMs = 0;
          console.log("countupPlay", nowId);
        }
      }
      this._playPreviousDate = new Date();
    } else {
      // 再生しているものがかわった
      this._playingId = nowId;
      this._playPreviousDate = null;
      this._playAccumTimeMs = 0;
      console.log("changePlayingId", nowId);
    }
  }

  countupPlay(id: number) {
    this.ipcRenderer.invoke("countupPlay", id);
  }

  getPlayInfo(): Promise<PlayInfo> {
    return this.ipcRenderer.invoke("mpcGetPlayInfo");
  }

  openFile(filePath: string) {
    this.ipcRenderer.invoke("mpcOpenFile", filePath);
  }

  saveScreenShot() {
    return this.ipcRenderer.invoke("mpcSaveScreenShot");
  }
}
