import PlayItem from "./PlayItem";
import DateFormat from "dateformat";
import { RatingType } from "./RatingType";

export default class PlayingItem {
  key: string;
  id: number;
  filePath: string;
  title: string;
  startTime: Date;
  isPlaying: boolean;
  library: PlayItem;
  isSkip: boolean;

  constructor() {
    this.key = "";
    this.id = -1;
    this.filePath = "";
    this.title = "";
    this.startTime = new Date();
    this.isPlaying = false;
    this.isSkip = false;
    this.library = new PlayItem({
      ADDDATE: "",
      CODEC: "",
      DATE: "",
      FILEPATH: "",
      GID: 0,
      GROUPNAME: "",
      ID: 0,
      ISPLAYED: 0,
      LASTPLAYDATE: "",
      LENGTH: "",
      NO: "",
      PLAYCOUNT: 0,
      RATING: 0,
      SEASON: "",
      TITLE: "",
      VIDEOSIZE: "",
    });
  }

  get isFavorite() {
    return this.library.rating == RatingType.Favorite;
  }

  get startTimeString() {
    return DateFormat(this.startTime, "HH:MM");
  }
}
