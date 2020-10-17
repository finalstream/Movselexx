import { Size } from "electron";

export default class DisplayInfo {
  no: number;
  size: Size;

  /**
   *
   */
  constructor(no: number, size: Size) {
    this.no = no;
    this.size = size;
  }
}
