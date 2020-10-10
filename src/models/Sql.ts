/**
 * アプリ設定
 */
export default class Sql {
  /**
   * ライブラリリストを取得
   */
  static SelectLibraryList = `SELECT 
      PL.ID AS ID,
      FILEPATH,
      GPL.GROUPNAME AS GROUPNAME,
      TITLE,
      NO,
      LENGTH,
      CODEC,
      PLAYED AS ISPLAYED,
      RATING,
      DATE,
      VIDEOSIZE,
      PLAYCOUNT,
      ADDDATE,
      LASTPLAYDATE,
      GPL.GID AS GID,
      SEASON
    FROM MOVLIST PL 
    LEFT JOIN MOVGROUPLIST GPL
    ON PL.GID = GPL.GID`;

  static SelectAllFilePathList = `SELECT
       FILEPATH 
      FROM MOVLIST 
      GROUP BY FILEPATH`;

  /**
   * ロガー設定ファイル
   */
  static LoggerConfigFile = "./log4js.config.json";
}
