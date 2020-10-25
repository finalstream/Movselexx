import DatabaseAccessor from "./DatabaseAccessor";
import PlayItem from "./PlayItem";
import Path from "path";
import fs, { Dirent } from "fs";
import AppConfig from "./AppConfig";
import NotificationService from "./NotificationService";
import ffprobe from "ffprobe";
import ffprobeStatic from "ffprobe-static";
import TimeSpan from "firx/TimeSpan";
import { IPlayerVariables } from "mpc-hc-control/lib/commands/commands";
import { IPlayItem } from "./IPlayItem";
import { IGroupItem } from "./IGroupItem";
import PlayingItem from "./PlayingItem";
import { RatingType } from "./RatingType";
import trash from "trash";

export default class LibraryService {
  _databaseAccessor: DatabaseAccessor;
  _notificationService: NotificationService;

  constructor(dba: DatabaseAccessor, ns: NotificationService) {
    this._databaseAccessor = dba;
    this._notificationService = ns;
  }

  countupPlay(id: number) {
    this._databaseAccessor.updatePlayCount(id);
  }

  async getLibraries(isShuffle: boolean, selectionRating: RatingType) {
    return await (
      await this._databaseAccessor.selectLibraries(isShuffle, selectionRating)
    ).filter(l => fs.existsSync(l.FILEPATH));
  }

  async getAllLibraryFilePaths() {
    return (await this._databaseAccessor.selectAllLibraryFilePaths()).map(p => p.FILEPATH);
  }

  async getLibraryByFilePath(filepath: string) {
    return await this._databaseAccessor.selectLibraryByFilePath(filepath);
  }

  async getPlayingList() {
    return await this._databaseAccessor.selectPlayingList();
  }

  async updateLibrary(playItems: PlayItem[]) {
    if (playItems.length == 0) return;

    const directories = playItems.map(p => Path.dirname(p.filePath));
    const baseDirctory = this.getMostUseDirectory(directories);
    const movFiles = this.getAllFiles(baseDirctory, AppConfig.SupportFileExts);

    this.registLibrary(movFiles);
  }

  async deleteLibrary(isDeleteFile: boolean, deleteItems: PlayItem[]) {
    for (const deleteItem of deleteItems) {
      this._databaseAccessor.deleteLibrary(deleteItem.id);
      if (isDeleteFile) await trash(deleteItem.filePath);
    }
  }

  registDrops(drops: string[]) {
    let files: string[] = [];
    for (const drop of drops) {
      const stat = fs.statSync(drop);
      if (stat.isDirectory()) {
        const movFiles = this.getAllFiles(drop, AppConfig.SupportFileExts);
        files = files.concat(movFiles);
      } else {
        if (AppConfig.SupportFileExts.includes(Path.extname(drop).toLowerCase())) files.push(drop);
      }
    }
    this.registLibrary(files);
  }

  async registLibrary(movFiles: string[]) {
    const registedFiles = await this.getAllLibraryFilePaths();

    this._databaseAccessor.transaction(async dba => {
      for (const f in movFiles) {
        const filePath = movFiles[f];
        if (!registedFiles.includes(filePath)) {
          try {
            this._notificationService.pushProgressInfo("Regist Files... " + filePath);

            const mediaFile = await ffprobe(filePath, { path: ffprobeStatic.path });
            const duration = new TimeSpan(mediaFile.streams[0].duration * 1000);
            if (mediaFile.streams[0].duration == undefined || mediaFile.streams[0].duration <= 0)
              continue; // 不完全ファイルはスキップ
            const movTitle = this.getMovTitle(filePath);
            const group = await this.getMovGroup(movTitle);
            const length = duration.minutes + ":" + ("00" + duration.seconds).slice(-2);
            const lastWriteDate = fs.statSync(filePath).mtime;
            this._databaseAccessor.insertLibrary({
              "@Gid": group.GID,
              "@FilePath": filePath,
              "@Option": null,
              "@Filesize": fs.statSync(filePath).size,
              "@No": this.getNo(filePath),
              "@Length": length,
              "@Title": movTitle,
              "@Codec": mediaFile.streams[0].codec_name,
              "@Rating": group.GROUPRATING,
              "@PlayCount": 0,
              "@Date": DatabaseAccessor.formatSQLiteDateString(lastWriteDate),
              "@NotFound": 0,
              "@Tag": null,
              "@AddDate": DatabaseAccessor.formatSQLiteDateString(new Date()),
              "@LastPlayDate": null,
              "@Played": 0,
              "@VideoSize": mediaFile.streams[0].width + "x" + mediaFile.streams[0].height,
              "@Season": lastWriteDate.getFullYear() + " " + this.getSeasonString(lastWriteDate),
            });
          } catch {}
        } else {
          // TODO: 同じものがあればファイルパス更新。そもそも同じという判定をファイルパスからかえる
        }
      }
      this._notificationService.pushProgressInfo("#END#");
    });
  }

  updatePlayingList(playingItems: PlayingItem[]) {
    this._databaseAccessor.transaction(async dba => {
      this._databaseAccessor.deletePlayingList();
      let sort = 1;
      for (const pi of playingItems) {
        this._databaseAccessor.insertPlayingList(pi.id, sort++);
      }
    });
  }

  switchRating(id: number, isFavorite: boolean): any {
    return this._databaseAccessor.updateRating(id, isFavorite);
  }

  private getSeasonString(date: Date) {
    const month = date.getMonth() + 1;

    switch (month) {
      case 1:
      case 2:
      case 3:
        return "Winter";
      case 4:
      case 5:
      case 6:
        return "Spring";
      case 7:
      case 8:
      case 9:
        return "Summer";
      case 10:
      case 11:
      case 12:
        return "Autumn";
    }
    return "Unknown";
  }

  private getNo(filePath: string) {
    let title = Path.basename(filePath, Path.extname(filePath));
    let work = "";
    let result = "";

    // x264はまぎらわしいのではずす
    title = this.replaceAll(title, "x264", "");

    // 括弧を半角に変換
    title = this.replaceAll(title, "（", "(");
    title = this.replaceAll(title, "）", ")");
    title = this.replaceAll(title, "［", "[");
    title = this.replaceAll(title, "］", "]");

    // 正規表現で括弧内の文字列をのぞく
    title = title.replace(/\(.*?\)/g, "");
    title = title.replace(/\[.*?\]/g, "");

    work = title.replace(/[^\d]/g, "");

    const ary = work.split(",").reverse();

    for (const i in ary) {
      const s = ary[i];
      if (Number.isInteger(parseInt(s, 10))) {
        result = s;
        break;
      }
    }

    if (result) {
      return parseInt(result, 10).toString();
    } else {
      return "";
    }
  }

  private getMovTitle(ss: string) {
    if (ss == null) return ss;
    let sss = Path.basename(ss, Path.extname(ss));

    sss = this.replaceAll(sss, "　", " ");
    sss = this.replaceAll(sss, "（", "(");
    sss = this.replaceAll(sss, "）", ")");
    sss = this.replaceAll(sss, "［", "[");
    sss = this.replaceAll(sss, "］", "]");
    sss = this.replaceAll(sss, "#", "");
    sss = this.replaceAll(sss, "RAW", "");

    var title = sss.replace(/[(\[].+?[)\]]/g, "").trim();

    return title ? title : ss;
  }

  private async getMovGroup(title: string): Promise<IGroupItem> {
    const keywords = this.createKeywords(title).reverse();
    for (const i in keywords) {
      const keyword = keywords[i];
      const group = await this._databaseAccessor.selectMatchGroupKeyword(keyword);

      if (group) {
        // 同じキーワードのグループが見つかったら情報を更新して抜ける
        const gid = group.GID;
        const groupRating = await this._databaseAccessor.getGroupRating(gid);
        this._databaseAccessor.updateGroupLastUpdateDatetime(gid);
        return {
          GID: group.GID,
          GROUPNAME: group.GROUPNAME,
          GROUPKEYWORD: keyword,
          GROUPRATING: groupRating,
        };
      }
    }

    // グループが見つからなかったら自動グループ登録
    const unGroupingItem = await this._databaseAccessor.selectUnGroupingLibrary(keywords);

    if (unGroupingItem != null) {
      const keyword = unGroupingItem.KEYWORD;
      const unGroupLibraries = unGroupingItem.RESULT;
      const groupNameandKeyword = keyword.trimEnd();

      // グループを登録する
      const gid = await this.registGroup(groupNameandKeyword, groupNameandKeyword);
      await this.joinGroup(groupNameandKeyword, groupNameandKeyword, unGroupLibraries);

      // グループのレーティングを取得
      const groupRating = await this._databaseAccessor.getGroupRating(gid);

      return {
        GID: gid,
        GROUPNAME: groupNameandKeyword,
        GROUPKEYWORD: groupNameandKeyword,
        GROUPRATING: groupRating,
      };
    }
    return { GID: null, GROUPNAME: "", GROUPKEYWORD: "", GROUPRATING: RatingType.Nothing };
  }

  async registGroup(groupName: string, keyword: string) {
    this._databaseAccessor.insertGroup(groupName, keyword);
    const gid: number = await this._databaseAccessor.selectLastInsertRowId();
    return gid;
  }

  async joinGroup(groupName: string, keyword: string, unGroupLibraries: IPlayItem[]) {
    let gid = await this._databaseAccessor.selectGIdByGroupName(groupName);

    if (gid == -1) {
      // グループが存在しない場合登録
      gid = await this.registGroup(groupName, keyword);
    }

    for (const i in unGroupLibraries) {
      const library = unGroupLibraries[i];
      this._databaseAccessor.updateGidById(gid, library.ID);
      this._databaseAccessor.updateGroupLastUpdateDatetime(gid);
      library.GROUPNAME = groupName;
    }
  }

  private createKeywords(title: string): string[] {
    const titlewords: string[] = this.replaceAll(title, " - ", " ").split(" ");

    const wordList = [];

    let workword: string = "";
    for (const i in titlewords) {
      const word = titlewords[i];
      if (word) {
        workword += word + " ";
        if (word != workword) {
          wordList.push(workword.trimEnd());
        } else {
          wordList.push(word);
        }
      }
    }

    return wordList;
  }

  private replaceAll(str: string, find: string, replace: string) {
    // TODO:ライブラリに追加する
    return str.replace(new RegExp(find, "g"), replace);
  }

  private getAllFiles(dir: string, exts: string[], files: string[] = []) {
    // TODO: ライブラリに追加する
    const dirents: Dirent[] = fs.readdirSync(dir, { withFileTypes: true });
    const dirs: string[] = [];
    for (const dirent of dirents) {
      if (dirent.isDirectory()) dirs.push(`${dir}\\${dirent.name}`);
      if (dirent.isFile()) {
        const filepath = `${dir}\\${dirent.name}`;
        if (exts.includes(Path.extname(filepath).toLowerCase())) files.push(filepath);
      }
    }
    for (const d of dirs) {
      files = this.getAllFiles(d, exts, files);
    }
    return files;
  }

  private getMostUseDirectory(directories: string[]) {
    // TODO: ライブラリに追加する
    const countMap = new Map<string, number>();

    directories.forEach(d => {
      let value = countMap.get(d) ?? 0;
      countMap.set(d, ++value);
    });

    let maxKey = "";
    let maxValue = 0;
    countMap.forEach((value, key) => {
      if (maxValue < value) {
        maxKey = key;
        maxValue = value;
      }
    });

    return maxKey;
  }
}
