import sqlite3 from "sqlite3";
import { Database } from "sqlite";
import Sql from "./Sql";
import path from "path";
import { IPlayItem } from "./IPlayItem";
import { IPlayerVariables } from "mpc-hc-control/lib/commands/commands";
import { RatingType } from "./RatingType";
import dateformat from "dateformat";

export default class DatabaseAccessor {
  db: Database<sqlite3.Database, sqlite3.Statement>;
  limit = 100;
  lastSelectLibrarySql = Sql.SelectLibraryList;

  constructor(databaseFileName: string) {
    const databaseFilePath = path.join(__dirname, "database", databaseFileName);
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

  async selectLibraries(isShuffle: boolean) {
    if (isShuffle) {
      return await this.db.all<IPlayItem[]>(this.createShuffleSql());
    } else {
      return await this.db.all<IPlayItem[]>(this.createSql(Sql.SelectLibraryList, true));
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
      var keywordCond = " lower(TITLE) LIKE '%{" + this.escapeSql(keyword.toLowerCase()) + "}%'";
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
    const gid: number = (await this.db.get<any>(Sql.SelectGIdByGroupName, "@GroupName", groupName))
      .GID;
    return gid ? gid : -1;
  }

  async getGroupRating(gid: number) {
    const gidcnt: number = (await this.db.get<any>(Sql.SelectGroupIdCount, { "@Gid": gid })).GCNT;

    if (gidcnt > 0) {
      const gidfavcnt: number = (await this.db.get<any>(Sql.SelectGroupIdCount, { "@Gid": gid }))
        .GCNT;

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
      "@Keyword": keyword,
      "@LastUpdate": DatabaseAccessor.formatSQLiteDateString(new Date()),
    });
  }

  async updatePlayCount(id: number) {
    await this.db.run(Sql.UpdatePlayCount, {
      "@Id": id,
      "@LastPlayDate": DatabaseAccessor.formatSQLiteDateString(new Date()),
    });
  }

  async updateGidById(gid: number, id: number) {
    await this.db.run(Sql.UpdateGidById, { "@Id": id, "@Gid": gid });
  }

  async updateGroupLastUpdateDatetime(gid: number) {
    await this.db.run(Sql.UpdateGroupLastUpdateDatetime, {
      "@LastUpdate": DatabaseAccessor.formatSQLiteDateString(new Date()),
      "@Gid": gid,
    });
  }

  public static formatSQLiteDateString(date: Date) {
    return dateformat(date, "yyyy-mm-dd HH:MM:ss");
  }

  private createSql(sql: string, withLimit: boolean = false) {
    this.lastSelectLibrarySql = sql;
    sql += " ORDER BY PL.DATE DESC ";
    if (withLimit) sql = sql + " LIMIT " + this.limit;

    return sql;
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
