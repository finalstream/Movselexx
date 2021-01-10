import { IGroupItem } from "./IGroupItem";
import { RatingType } from "./RatingType";

export default class GroupItem {
  groupId: number | null;
  groupName: string;
  groupKeyword: string;
  groupRating: number;
  drives: string[];
  fileSize: number;
  isCompleted: boolean;
  groupCount: number;

  /**
   *
   */
  constructor(item: IGroupItem) {
    this.groupId = item.GID;
    this.groupName = item.GROUPNAME;
    this.groupKeyword = item.GROUPKEYWORD;
    this.groupRating =
      item.GFAVCNT == item.GCNT && item.GFAVCNT > 0 ? RatingType.Favorite : RatingType.Normal;
    this.drives = item.DRIVE.split(",");
    this.fileSize = item.FILESIZE;
    this.isCompleted = item.COMPLETED == 1 ? true : false;
    this.groupCount = item.GCNT;
  }

  get isFavorite() {
    return this.groupRating == RatingType.Favorite;
  }

  get fileSizeGB() {
    return (this.fileSize / 1073741824.0).toFixed(2);
  }
}
