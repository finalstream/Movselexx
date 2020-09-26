import sqlite3 from "sqlite3";
import { Database } from "sqlite";
import Sql from "./Sql";
import path from "path";
import { IPlayItem } from "./IPlayItem";

export default class DatabaseAccessor {
  db: Database<sqlite3.Database, sqlite3.Statement>;
  limit = 100;

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

  async selectLibrary() {
    return await this.db.all<IPlayItem[]>(
      this.getSql(Sql.SelectLibraryList, true)
    );
  }

  private getSql(sql: string, withLimit: boolean = false) {
    if (withLimit) sql = sql + " LIMIT " + this.limit;
    return sql;
  }
}