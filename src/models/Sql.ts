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

  static SelectGroupList = `SELECT GGPL.GID,GNAME GROUPNAME,CNT GCNT,cast(FAVCNT as integer) GFAVCNT, DL.DRIVE, FSL.FILESIZE, GGPL.KEYWORD GROUPKEYWORD, GGPL.COMPLETE COMPLETED, GGPL.LASTUPDATE
  FROM (SELECT GPL.GID,GPL.GROUPNAME GNAME , ifnull(ACL.cnt,0) CNT #CLASS1COUNT# FAVCNT, GPL.KEYWORD, GPL.COMPLETE, GPL.LASTUPDATE
  FROM (#LASTEXECSQL#) PL
  #JOIN#
  GROUP BY GPL.GROUPNAME
  ORDER BY GPL.LASTUPDATE DESC, GPL.GID DESC) GGPL
  LEFT JOIN (SELECT DSLIST.GID, group_concat(DISTINCT UPPER(DSLIST.DRIVE)) DRIVE FROM MOVLIST DSLIST GROUP BY DSLIST.GID) DL ON ifnull(GGPL.GID,'') = ifnull(DL.GID,'')
  LEFT JOIN (SELECT GID, SUM(FILESIZE) FILESIZE FROM MOVLIST GROUP BY GID) FSL ON ifnull(GGPL.GID,'') = ifnull(FSL.GID,'')`;

  static SelectAllFilePathList = `SELECT
       FILEPATH 
      FROM MOVLIST 
      GROUP BY FILEPATH`;

  static SelectGroupKeyword = `SELECT 
      GID,
      GROUPNAME
    FROM MOVGROUPLIST 
    WHERE KEYWORD = @Keyword`;

  static SelectGroupIdCount = `SELECT count(GID) GCNT 
      FROM MOVLIST
      WHERE GID = @Gid
      GROUP BY GID`;

  static SelectFavGroupIdCount = `SELECT count(ID) GCNT 
      FROM MOVLIST
      WHERE GID = @Gid
      AND RATING = 9`;

  static SelectNoGroupFromTitle = `SELECT ID, TITLE  FROM MOVLIST WHERE GID IS NULL AND (#0#)`;

  static SelectLastInsertRowid = `SELECT last_insert_rowid() AS LASTROWID`;

  static SelectGIdByGroupName = `SELECT 
      GID 
    FROM MOVGROUPLIST 
    WHERE lower(GROUPNAME) = @GroupName`;

  static SelectShuffleLibrary = `SELECT * FROM (#LastExecSql#) ORDER BY random() `;

  static InsertLibrary = `INSERT INTO MOVLIST(
    FILEPATH,
    TITLE,
    NO,
    GID,
    LENGTH,
    CODEC,
    RATING,
    VIDEOSIZE,
    PLAYCOUNT,
    DATE,
    NOTFOUND,
    OPTION,
    TAG,
    ADDDATE,
    LASTPLAYDATE,
    DRIVE,
    FILESIZE,
    PLAYED,
    SEASON
  ) VALUES (
    @FilePath,
    @Title,
    @No,
    @Gid,
    @Length,
    @Codec,
    @Rating,
    @VideoSize,
    @PlayCount,
    @Date,
    @NotFound,
    @Option,
    @Tag,
    @AddDate,
    @LastPlayDate,
    SUBSTR(@FilePath,1,1),
    @Filesize,
    @Played,
    @Season
  )`;

  static InsertGroup = `INSERT INTO MOVGROUPLIST(
        GROUPNAME,
        KEYWORD,
        LASTUPDATE
      ) VALUES (
        @GroupName,
        @Keyword,
        @LastUpdate
      )`;

  static InsertPlayingList = `INSERT INTO PLAYINGLIST(ID, SORT) VALUES (@Id, @Sort)`;

  static UpdateGroupLastUpdateDatetime = `UPDATE MOVGROUPLIST 
      SET
      LASTUPDATE = @LastUpdate
      WHERE GID = @Gid`;

  static UpdateGidById = `UPDATE MOVLIST 
      SET
      GID = @Gid
      WHERE ID = @Id`;

  static UpdatePlayCount = `UPDATE MOVLIST
      SET PLAYCOUNT = PLAYCOUNT + 1,
      LASTPLAYDATE = @LastPlayDate
      WHERE ID = @Id`;

  static UpdateRating = `UPDATE MOVLIST
  SET RATING = @Rating
  WHERE ID = @Id`;

  static UpdatePlayed = `UPDATE MOVLIST
  SET PLAYED = @Played
  WHERE ID = @Id`;

  static DeleteLibrary = `DELETE FROM MOVLIST 
  WHERE ID = @Id`;

  static DeletePlayingList = `DELETE FROM PLAYINGLIST`;
}
