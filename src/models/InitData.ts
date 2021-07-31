import { Display } from "electron";

export default class InitData {
  displays: Display[];
  filters: any[];
  mpcExePath: string;
  playDisplayNo: number;

  /**
   *
   */
  constructor(displays: Display[], filters: any[], mpcExePath: string, playDisplayNo: number) {
    this.displays = displays;
    this.filters = filters;
    this.mpcExePath = mpcExePath;
    this.playDisplayNo = playDisplayNo;
  }
}
