import TimeSpan from "firx/TimeSpan";
import Path from "path";
import { IPlayItem } from "./IPlayItem";
import PlayItem from "./PlayItem";
import { RatingType } from "./RatingType";
export default class PlayInfo {
  file: string;
  filepath: string;
  state: number;
  duration: number;
  position: number;
  durationString: string;
  positionString: string;
  isMuted: boolean;
  library: PlayItem | null;

  constructor() {
    this.file = "";
    this.filepath = "";
    this.state = -1;
    this.duration = 0;
    this.position = 0;
    this.durationString = "";
    this.positionString = "";
    this.isMuted = false;
    this.library = null;
  }

  update(playInfo: PlayInfo) {
    this.file = playInfo.file;
    this.filepath = playInfo.filepath;
    this.state = playInfo.state;
    this.duration = playInfo.duration;
    this.position = playInfo.position;
    this.durationString = playInfo.durationString;
    this.positionString = playInfo.positionString;
    this.isMuted = playInfo.isMuted;
    this.library = playInfo.library;
  }

  getTitle() {
    return this.library != null
      ? this.library.title
      : Path.basename(this.file, Path.extname(this.file));
  }

  getGroupName() {
    return this.library != null ? this.library.groupName : "";
  }

  getSeason() {
    return this.library != null ? this.library.season : "";
  }

  get hasLibrary() {
    return this.library != null ? true : false;
  }

  get isFavorite() {
    return this.library && this.library.rating == RatingType.Favorite ? true : false;
  }
}
