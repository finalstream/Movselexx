import { FilterMode } from "./FilterMode";
import GroupItem from "./GroupItem";

export default class FilterCondition {
  mode: FilterMode;
  sql: string;
  isFullSql: boolean;
  isLimited: boolean;
  groupId: number;

  /**
   *
   */
  constructor() {
    this.mode = FilterMode.None;
    this.sql = "";
    this.isFullSql = false;
    this.isLimited = true;
    this.groupId = -1;
  }

  /**
   *
   */
  updatePresets(sql: string, isFullSql: boolean, isLimited: boolean) {
    this.mode = FilterMode.Sql;
    this.sql = sql;
    this.isFullSql = isFullSql;
    this.isLimited = isLimited;
    this.groupId = -1;
  }

  updateGroup(group: GroupItem) {
    this.mode = FilterMode.Group;
    this.sql = "";
    this.isFullSql = false;
    this.isLimited = true;
    this.groupId = group.groupId!;
  }
}
