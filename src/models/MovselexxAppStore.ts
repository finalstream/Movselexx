export default class MovselexxAppStore {
  mpcExePath: string;
  mpcPort: number;
  playDisplayNo: number;

  /**
   *
   */
  constructor() {
    this.mpcExePath = "";
    this.playDisplayNo = 1;
    this.mpcPort = 13579;
  }
}
