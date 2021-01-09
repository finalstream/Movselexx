import { FilterMode } from "./FilterMode";

export default class FilterCondition {
  mode: FilterMode;
  sql: string;
  isFullSql: boolean;
  isLimited: boolean;

  /**
   *
   */
  constructor() {
    this.mode = FilterMode.None;
    this.sql = "";
    this.isFullSql = false;
    this.isLimited = true;
  }

  /**
   *
   */
  update(mode: FilterMode, sql: string, isFullSql: boolean, isLimited: boolean) {
    this.mode = mode;
    this.sql = sql;
    this.isFullSql = isFullSql;
    this.isLimited = isLimited;
  }
}
