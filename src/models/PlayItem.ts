import { TouchBarSlider } from "electron";
import { IPlayItem } from "./IPlayItem";
import { RatingType } from "./RatingType";

export default class PlayItem {
  id: number;
  filePath: string;
  isPlaying: boolean;
  groupId: number;
  groupName: string;
  title: string;
  no: string;
  length: string;
  isPlayed: boolean;
  date: string;
  videoSize: string;
  drive: string;
  playCount: number;
  isSelected: boolean;
  rating: number;

  /**
   *
   */
  constructor(item: IPlayItem) {
    this.id = item.ID;
    this.filePath = item.FILEPATH;
    this.isPlaying = false;
    this.groupId = item.GID;
    this.groupName = item.GROUPNAME;
    this.title = item.TITLE;
    this.no = item.NO;
    this.length = item.LENGTH;
    this.rating = item.RATING;
    this.isPlayed = item.ISPLAYED == 1;
    this.date = item.DATE;
    this.videoSize = item.VIDEOSIZE;
    this.drive = item.FILEPATH.substr(0, 1).toUpperCase();
    this.playCount = item.PLAYCOUNT;
    this.isSelected = false;
  }

  get isFavorite() {
    return this.rating == RatingType.Favorite;
  }
}
