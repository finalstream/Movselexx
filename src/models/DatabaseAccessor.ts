import sqlite3 from "sqlite3";
import { Database } from "sqlite";
import { app } from "electron";
import Sql from "./Sql";
import path from "path";
import fs from "fs";
import { IPlayItem } from "./IPlayItem";
import { IPlayerVariables } from "mpc-hc-control/lib/commands/commands";
import { RatingType } from "./RatingType";
import dateformat from "dateformat";
import AppUtils from "firx/AppUtils";
import FilterCondition from "./FilterCondition";
import { FilterMode } from "./FilterMode";

export default class DatabaseAccessor {
  db: Database<sqlite3.Database, sqlite3.Statement>;
  limit = 100;
  lastSelectLibrarySql = Sql.SelectLibraryList;

  constructor(databaseFileName: string) {
    const appDirectory = AppUtils.getAppDirectory(app);
    const blankdatabaseFilePath = path.join(appDirectory, "database", "blank.movselexdatabase");
    const databaseFilePath = path.join(appDirectory, "database", databaseFileName);
    if (!fs.existsSync(databaseFilePath)) fs.copyFileSync(blankdatabaseFilePath, databaseFilePath);

    this.db = new Database({
      filename: databaseFilePath,
      driver: sqlite3.Database,
    });
  }

  async open() {
    await this.db.open();
  }

  transaction(proc: (dba: DatabaseAccessor) => void) {
    const database = this.db.getDatabaseInstance();
    database.serialize(() => {
      try {
        database.run("BEGIN TRANSACTION");
        proc(this);
        database.run("COMMIT");
      } catch (e) {
        database.run("ROLLBACK");
      }
    });
  }

  async selectLibraries(
    isShuffle: boolean,
    selectionRating: RatingType,
    searchKeyword: string,
    filterCondition: FilterCondition
  ) {
    if (isShuffle) {
      return await this.db.all<IPlayItem[]>(this.createShuffleSql());
    } else {
      return await this.db.all<IPlayItem[]>(
        this.createSql(Sql.SelectLibraryList, selectionRating, searchKeyword, filterCondition)
      );
    }
  }

  async selectAllLibraryFilePaths() {
    return await this.db.all<IPlayItem[]>(Sql.SelectAllFilePathList);
  }

  async selectLibraryByFilePath(filepath: string) {
    return await this.db.get<IPlayItem>(Sql.SelectLibraryList + " WHERE FILEPATH = @FilePath", {
      "@FilePath": filepath,
    });
  }

  async selectMatchGroupKeyword(keyword: string) {
    return await this.db.get<IPlayItem>(Sql.SelectGroupKeyword, {
      "@Keyword": keyword.toLowerCase(),
    });
  }

  async selectUnGroupingLibrary(keywords: string[]) {
    for (const i in keywords) {
      const keyword = keywords[i];
      var keywordCond = " lower(TITLE) LIKE '%" + this.escapeSql(keyword.toLowerCase()) + "%'";
      var sql = Sql.SelectNoGroupFromTitle.replace("#0#", keywordCond);
      var result = await this.db.all<IPlayItem[]>(sql);
      if (result && result.length > 0) return { KEYWORD: keyword, RESULT: result };
    }

    return null;
  }

  async selectLastInsertRowId() {
    return (await this.db.get<any>(Sql.SelectLastInsertRowid)).LASTROWID;
  }

  async selectGIdByGroupName(groupName: string) {
    const gidResult: any = await this.db.get<any>(Sql.SelectGIdByGroupName, {
      "@GroupName": groupName.toLowerCase(),
    });
    const gid = gidResult ? gidResult.GID : undefined;
    return gid ? gid : -1;
  }

  async selectPlayingList() {
    let sql = Sql.SelectLibraryList;
    sql += " INNER JOIN ";
    sql += " PLAYINGLIST PIL ";
    sql += " ON PL.ID = PIL.ID ";
    sql += "ORDER BY PIL.SORT";
    return await this.db.all<IPlayItem[]>(sql);
  }

  async getGroupRating(gid: number) {
    const gidcntResult: any = await this.db.get<any>(Sql.SelectGroupIdCount, { "@Gid": gid });
    const gidcnt = gidcntResult ? gidcntResult.GCNT : 0;

    if (gidcnt > 0) {
      const gidfavcntResult: any = await this.db.get<any>(Sql.SelectFavGroupIdCount, {
        "@Gid": gid,
      });
      const gidfavcnt = gidfavcntResult ? gidfavcntResult.GCNT : 0;

      if (gidcnt == gidfavcnt) return RatingType.Favorite;
    }

    return RatingType.Nothing;
  }

  async insertLibrary(librarydata: any) {
    await this.db.run(Sql.InsertLibrary, librarydata);
  }

  async insertGroup(groupName: string, keyword: string) {
    await this.db.run(Sql.InsertGroup, {
      "@GroupName": groupName,
      "@Keyword": keyword.toLowerCase(),
      "@LastUpdate": DatabaseAccessor.formatSQLiteDateString(new Date()),
    });
  }

  async insertPlayingList(id: number, sort: number) {
    await this.db.run(Sql.InsertPlayingList, {
      "@Id": id,
      "@Sort": sort,
    });
  }

  async updatePlayCount(id: number) {
    await this.db.run(Sql.UpdatePlayCount, {
      "@Id": id,
      "@LastPlayDate": DatabaseAccessor.formatSQLiteDateString(new Date()),
    });
  }

  async updateGidById(gid: number | null, id: number) {
    await this.db.run(Sql.UpdateGidById, { "@Id": id, "@Gid": gid });
  }

  async updateGroupLastUpdateDatetime(gid: number) {
    await this.db.run(Sql.UpdateGroupLastUpdateDatetime, {
      "@LastUpdate": DatabaseAccessor.formatSQLiteDateString(new Date()),
      "@Gid": gid,
    });
  }

  async updateRating(id: number, isFavorite: boolean) {
    const rating = isFavorite ? RatingType.Favorite : RatingType.Normal;
    await this.db.run(Sql.UpdateRating, {
      "@Rating": rating,
      "@Id": id,
    });
    return rating;
  }

  async updatePlayed(id: number, isPlayed: boolean) {
    const played = isPlayed ? "1" : "0";
    await this.db.run(Sql.UpdatePlayed, {
      "@Played": played,
      "@Id": id,
    });
    return isPlayed;
  }

  async deleteLibrary(deleteid: number) {
    await this.db.run(Sql.DeleteLibrary, {
      "@Id": deleteid,
    });
  }

  async deletePlayingList() {
    await this.db.run(Sql.DeletePlayingList);
  }

  public static formatSQLiteDateString(date: Date) {
    return dateformat(date, "yyyy-mm-dd HH:MM:ss");
  }

  private createSql(
    sql: string,
    selectionRating: RatingType,
    searchKeyword: string,
    filterCondition: FilterCondition
  ) {
    if (filterCondition.isFullSql) {
      sql += " " + filterCondition.sql;
    } else {
      // Generate WHERE
      sql += " WHERE ";
      // Rating
      sql += this.getRatingWhereString(selectionRating);

      // Keyword
      if (searchKeyword) {
        const searchKeywordLower = searchKeyword.toLowerCase();
        sql +=
          " AND lower(IFNULL(FILEPATH,'') || IFNULL(TITLE,'') || IFNULL(GPL.GROUPNAME,'') || IFNULL(SEASON,'')) LIKE '%" +
          this.escapeSql(searchKeywordLower) +
          "%' ";
      }

      // FilterMode
      switch (filterCondition.mode) {
        case FilterMode.Sql:
          sql += " " + filterCondition.sql;
          break;
        case FilterMode.Group:
          break;
      }
    }

    this.lastSelectLibrarySql = sql;
    if (sql.indexOf("ORDER BY") == -1) sql += " ORDER BY PL.DATE DESC ";
    if (filterCondition.isLimited) sql = sql + " LIMIT " + this.limit;

    return sql;
  }
  getRatingWhereString(selectionRating: RatingType) {
    switch (selectionRating) {
      case RatingType.Normal:
        return "RATING > 0 ";
      case RatingType.Favorite:
        return "RATING = 9 ";
      case RatingType.Exclution:
        return "RATING = 0 ";
    }
  }

  private createShuffleSql() {
    return (
      Sql.SelectShuffleLibrary.replace("#LastExecSql#", this.lastSelectLibrarySql) +
      " LIMIT " +
      this.limit
    );
  }

  private escapeSql(sql: string) {
    return sql.replace(new RegExp("'", "g"), "''");
  }
}
