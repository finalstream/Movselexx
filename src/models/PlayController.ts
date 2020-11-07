import MpcClient from "./MpcClient";
import PlayInfo from "./PlayInfo";
import PlayingItem from "./PlayingItem";
import PlayItem from "./PlayItem";
import TimeSpan from "firx/TimeSpan";
import ArrayUtils from "firx/ArrayUtils";

export default class PlayController {
  private _mpcClient: MpcClient;
  private _playingId: number;
  private _playingInfo: PlayInfo | null;
  private _playPreviousFilePath: string;
  private _playPreviousDate: Date | null;
  private _playAccumTimeMs: number;
  private _playings: PlayingItem[];
  private _lastMakePlayings: PlayingItem[];

  CountUpParsent = 0.7;

  constructor(mpcClient: MpcClient) {
    this._mpcClient = mpcClient;
    this._playingId = -1;
    this._playPreviousDate = null;
    this._playAccumTimeMs = 0;
    this._playings = [];
    this._lastMakePlayings = [];
    this._playingInfo = null;
    this._playPreviousFilePath = "";
  }

  public get playingId() {
    return this._playingId;
  }

  public get playings(): PlayingItem[] {
    return this._playings;
  }

  monitoring(pi: PlayInfo): boolean {
    let isUpdatePlayings = false;
    if (pi.library == null) return false;
    const nowId = pi.library.ID;
    this._playingInfo = pi;

    if (nowId == this._playingId) {
      if (pi.duration == pi.position && pi.state == 1) {
        // 再生が停止されたら再生リストの次のアイテムを再生
        this.playNext(false);
        //isUpdatePlayings = true;
      }
      // 継続再生
      if (this._playPreviousDate == null) {
        // 初回はカウント開始記録だけ(進んだ量がわからないため)
      } else if (pi.state == 2) {
        // 再生中の場合、経過した時間を蓄積する
        const playIncrementalTimeMs = new Date().getTime() - this._playPreviousDate.getTime();
        this._playAccumTimeMs += playIncrementalTimeMs;
        const countUpDurationMs = pi.duration * this.CountUpParsent;

        //console.log("playingId", nowId);
        //console.log("playAccumTimeMs", this._playAccumTimeMs);
        //console.log("countUpDurationMs", countUpDurationMs);
        if (countUpDurationMs <= this._playAccumTimeMs) {
          // 再生回数をカウントアップする
          this._mpcClient.countupPlay(nowId);
          // 累積時間をリセット
          this._playAccumTimeMs = 0;
          //console.log("countupPlay", nowId);
        }
      }
      this._playPreviousDate = new Date();
    } else {
      // 再生しているものがかわった

      // 再生中リストから前回再生していたものを取り除く
      this.updatePlayingList(nowId, new PlayItem(pi.library));

      this._playingId = nowId;
      this._playPreviousDate = null;
      this._playAccumTimeMs = 0;
      console.log("changePlayingId", nowId);
      isUpdatePlayings = true;
    }
    return isUpdatePlayings;
  }

  async playNext(isManual: boolean) {
    if (this._playingInfo) this._playPreviousFilePath = this._playingInfo.filepath!;
    const isFullScreen = !isManual;
    this._playings.shift();
    const nextItem = this.playings[0];
    if (nextItem) {
      if (nextItem.isSkip) {
        // スキップが設定されていたら次へ
        this.playNext(isManual);
        return;
      }
      await this._mpcClient.openFile(nextItem.filePath, isFullScreen);
    } else if (this._lastMakePlayings.length > 0) {
      // 最後までいったらlastPlayingから復元する
      this._playings = this._playings.concat(this._lastMakePlayings);
      await this._mpcClient.openFile(this._playings[0].filePath, isFullScreen);
    }
    this._playingId = -1;
  }

  async playPrev() {
    if (this._playPreviousFilePath) {
      await this._mpcClient.openFile(this._playPreviousFilePath, false);
      this._playingId = -1;
    }
  }

  getCountUpRemainMs() {
    if (!this._playingInfo) return null;
    return this._playingInfo.duration * this.CountUpParsent - this._playAccumTimeMs;
  }

  updatePlayingList(nowId: number, nextItem: PlayItem) {
    const nowPlayindex = this._playings.findIndex(v => v.id == nowId);
    if (nowPlayindex != -1) {
      this._playings.splice(0, nowPlayindex);
      this.addPlayingItems(
        this._playings.map(p => p.library),
        false,
        false
      );
    } else {
      // 見つからなかったら再生中リストを更新
      this.addPlayingItems([nextItem], true, false);
    }
  }

  addPlayingItems(items: PlayItem[], isAdd: boolean, isRebuild: boolean, removeId?: number) {
    if (isAdd) {
      items = items.concat(this._playings.map(p => p.library));
    }

    this.clearPlayings();
    let count = 0;
    for (const item of items) {
      const pi = this.createPlayingItem(item);
      if (count == 0) {
        // 最初のアイテムだけ現在時刻を設定(再生開始時刻の推測に使用)
        pi.startTime = new Date();
      }
      if (count > 0) {
        if (pi.id == removeId) {
          // 再生終盤のidを除外
          removeId = -1;
          continue;
        }
      }
      this._playings.push(pi);
      count++;
    }

    if (isRebuild) {
      ArrayUtils.clear(this._lastMakePlayings);
      this._lastMakePlayings = this._lastMakePlayings.concat(this._playings);
    }

    this.calcStartTime();
  }

  calcStartTime() {
    // ベース時刻は最初のアイテムとする
    let currentTime = this.playings[0].startTime;
    let currentTimeSpan = TimeSpan.fromMilliseconds(currentTime.getTime());
    let count = 0;
    for (const item of this._playings) {
      if (count == 0 || item.isSkip) {
        count++;
        continue;
      }
      let durationSpan = TimeSpan.zero;
      durationSpan = TimeSpan.parse(item.library.length);
      currentTime = new Date(currentTimeSpan.add(durationSpan).totalMilliseconds);
      currentTimeSpan = TimeSpan.fromMilliseconds(currentTime.getTime());

      item.startTime = currentTime;
      count++;
    }
  }

  createPlayingItem(item: PlayItem) {
    const pi = new PlayingItem();
    pi.key = this.getUniqueKey(100000);
    pi.id = item.id;
    pi.filePath = item.filePath;
    pi.title = item.title;
    pi.library = item;
    return pi;
  }

  getUniqueKey(myStrong?: number): string {
    let strong = 1000;
    if (myStrong) strong = myStrong;
    return new Date().getTime().toString(16) + Math.floor(strong * Math.random()).toString(16);
  }

  setSkip(key: string) {
    this._playings.filter(p => p.key == key).forEach(p => (p.isSkip = true));
    this._lastMakePlayings.filter(p => p.key == key).forEach(p => (p.isSkip = true));
  }

  reserveNext(item: PlayItem) {
    const reserveItem = this.createPlayingItem(item);
    this._playings.splice(1, 0, reserveItem);
    this.calcStartTime();
    // ストックしているリストにも反映
    const playingItem = this._playings[0];
    if (playingItem) {
      const idx = this._lastMakePlayings.findIndex(p => p.key == playingItem.key);
      if (idx != -1) {
        this._lastMakePlayings.splice(idx, 0, reserveItem);
      }
    }
  }

  isNearEnd() {
    if (this._playingInfo == null) return;
    const remainTime = new TimeSpan(this._playingInfo.duration - this._playingInfo.position);
    return remainTime.totalMinutes < 5;
  }

  clearPlayings() {
    ArrayUtils.clear(this._playings);
  }
}
