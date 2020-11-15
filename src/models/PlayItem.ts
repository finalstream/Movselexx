import { IPlayItem } from "./IPlayItem";
import { RatingType } from "./RatingType";
import DateFormat from "dateformat";
import path from "path";
import TimeSpan from "firx/TimeSpan";

export default class PlayItem {
  key: string;
  id: number;
  filePath: string;
  isPlaying: boolean;
  groupId: number;
  groupName: string;
  title: string;
  no: string;
  length: string;
  isPlayed: boolean;
  date: Date;
  lastPlayDate: Date;
  videoSize: string;
  drive: string;
  playCount: number;
  isSelected: boolean;
  rating: number;
  season: string;

  /**
   *
   */
  constructor(item: IPlayItem) {
    this.key = this.getUniqueKey(100000);
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
    this.date = new Date(item.DATE);
    this.lastPlayDate = new Date(item.LASTPLAYDATE);
    this.videoSize = item.VIDEOSIZE;
    this.drive = item.FILEPATH.substr(0, 1).toUpperCase();
    this.playCount = item.PLAYCOUNT;
    this.isSelected = false;
    this.season = item.SEASON;
  }

  getUniqueKey(myStrong?: number): string {
    let strong = 1000;
    if (myStrong) strong = myStrong;
    return new Date().getTime().toString(16) + Math.floor(strong * Math.random()).toString(16);
  }

  get dateString() {
    return DateFormat(this.date, "yyyy-mm-dd");
  }

  get lastPlayDateString() {
    return this.getRelativeTimeString(this.lastPlayDate);
  }

  get extension() {
    return path
      .extname(this.filePath)
      .toUpperCase()
      .substr(1);
  }

  get isFavorite() {
    return this.rating == RatingType.Favorite;
  }

  getRelativeTimeString(targetDateTime: Date) {
    // TODO: ライブラリに移す
    if (
      !targetDateTime ||
      targetDateTime.getTime() == new Date("1970-01-01Z00:00:00:000").getTime()
    )
      return "";

    const ts = new TimeSpan(new Date().getTime() - targetDateTime.getTime());
    const delta = Math.abs(ts.totalSeconds);

    const SECOND = 1;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const MONTH = 30 * DAY;

    if (delta < 0) {
      return "not yet";
    }
    if (delta < 1 * MINUTE) {
      //return ts.Seconds == 1 ? "one second ago" : ts.Seconds + " seconds ago";
      return ts.seconds == 1 ? "1 second ago" : ts.seconds + " seconds ago";
    }
    if (delta < 2 * MINUTE) {
      //return "a minute ago";
      return "1 minute ago";
    }
    if (delta < 45 * MINUTE) {
      return ts.minutes + " minutes ago";
    }
    if (delta < 90 * MINUTE) {
      //return "an hour ago";
      return "1 hour ago";
    }
    if (delta < 24 * HOUR) {
      return ts.hours == 1 ? "1 hour ago" : ts.hours + " hours ago";
    }
    if (delta < 48 * HOUR) {
      return "yesterday";
    }
    if (delta < 30 * DAY) {
      return ts.days + " days ago";
    }
    if (delta < 12 * MONTH) {
      const months = Math.floor(ts.days / 30);
      //return months <= 1 ? "one month ago" : months + " months ago";
      return months <= 1 ? "1 month ago" : months + " months ago";
    } else {
      const years = Math.floor(ts.days / 365);
      //return years <= 1 ? "one year ago" : years + " years ago";
      return years <= 1 ? "1 year ago" : years + " years ago";
    }
  }
}
