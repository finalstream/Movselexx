import { TouchBarSlider } from "electron";
import { IPlayItem } from "./IPlayItem";

export default class PlayItem {
  id: number;
  isPlaying: boolean;
  groupId: number;
  groupName: string;
  title: string;
  no: string;
  length: string;
  isFavorite: boolean;
  isPlayed: boolean;
  date: string;
  videoSize: string;
  drive: string;
  playCount: number;

  /**
   *
   */
  constructor(item: IPlayItem) {
    this.id = item.ID;
    this.isPlaying = false;
    this.groupId = item.GID;
    this.groupName = item.GROUPNAME;
    this.title = item.TITLE;
    this.no = item.NO;
    this.length = item.LENGTH;
    this.isFavorite = item.RATING == 9;
    this.isPlayed = item.ISPLAYED == 1;
    this.date = item.DATE;
    this.videoSize = item.VIDEOSIZE;
    this.drive = item.FILEPATH.substr(0, 1);
    this.playCount = item.PLAYCOUNT;
  }
}
