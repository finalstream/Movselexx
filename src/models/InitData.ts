import { Display } from "electron";

export default class InitData {
  displays: Display[];
  filters: any[];

  /**
   *
   */
  constructor(displays: Display[], filters: any[]) {
    this.displays = displays;
    this.filters = filters;
  }
}
