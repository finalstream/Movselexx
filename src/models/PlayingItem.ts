import PlayItem from "./PlayItem";

export default class PlayingItem {
  key: string;
  id: number;
  filePath: string;
  title: string;
  startTimeString: string;
  isPlaying: boolean;
  library: PlayItem;
  isSkip: boolean;

  constructor() {
    this.key = "";
    this.id = -1;
    this.filePath = "";
    this.title = "";
    this.startTimeString = "";
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
}
