import { MpcControl } from "mpc-hc-control";
import { IPlayerVariables } from "mpc-hc-control/lib/commands/commands";
import child_process from "child_process";

export default class MpcService {
  private _mpcControl: MpcControl;

  constructor(host: string, port: number) {
    this._mpcControl = new MpcControl(host, port);
  }

  getPlayInfo(): Promise<IPlayerVariables> {
    return this._mpcControl.getVariables();
  }

  async openFile(filePath: string, isFullScreen: boolean) {
    await this._mpcControl.openFile(encodeURIComponent(filePath));
    if (isFullScreen) await this._mpcControl.execute("FULLSCREEN");
  }

  seek(position: number) {
    return this._mpcControl.seek(position);
  }

  async toggleMute() {
    this._mpcControl.toggleMute();
  }

  async saveScreenShot() {
    await this._mpcControl.execute("SAVE_IMAGE_AUTO");
  }

  async boot(mpcExePath: string, screenNo: number) {
    //await child_process.execFile(mpcExePath, ['""', "/fullscreen", '"/monitor 2"']);
    await child_process.exec('"' + mpcExePath + '" ' + '""' + "/monitor " + screenNo);
    await this.sleep(2000);
  }

  sleep(t: number) {
    // TODO:ライブラリ化
    return new Promise((r) => {
      setTimeout(() => {
        r(undefined);
      }, t);
    });
  }
}
