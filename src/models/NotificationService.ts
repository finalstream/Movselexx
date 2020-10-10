import { WebContents } from "electron";

export default class NotificationService {
  _webContents: WebContents;

  constructor(wc: WebContents) {
    this._webContents = wc;
  }

  pushProgressInfo(message: string) {
    this._webContents.send("pushProgressInfo", message);
  }
}
