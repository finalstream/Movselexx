import Path from "path";
export default class PlayInfo {
  file: string;
  duration: number;
  position: number;
  durationString: string;
  positionString: string;

  constructor() {
    this.file = "";
    this.duration = 0;
    this.position = 0;
    this.durationString = "";
    this.positionString = "";
  }

  update(playInfo: PlayInfo) {
    this.file = playInfo.file;
    this.duration = playInfo.duration;
    this.position = playInfo.position;
    this.durationString = playInfo.durationString;
    this.positionString = playInfo.positionString;
  }

  getTitle() {
    return Path.basename(this.file, Path.extname(this.file));
  }
}
