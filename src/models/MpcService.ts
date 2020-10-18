import { MpcControl } from "mpc-hc-control";
import { IPlayerVariables } from "mpc-hc-control/lib/commands/commands";
export default class MpcService {
  private _mpcControl: MpcControl;

  constructor(host: string, port: number) {
    this._mpcControl = new MpcControl(host, port);
  }

  getPlayInfo(): Promise<IPlayerVariables> {
    return this._mpcControl.getVariables();
  }

  openFile(filePath: string, isFullScreen: boolean) {
    this._mpcControl.openFile(filePath);
    if (isFullScreen) this._mpcControl.execute("FULLSCREEN");
  }

  async saveScreenShot() {
    await this._mpcControl.execute("SAVE_IMAGE_AUTO");
  }
}
