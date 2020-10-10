import { WebContents } from 'electron';

export default class NotificationService {
  _webContents: WebContents;

  constructor(wc: WebContents) {
    this._webContents = wc;
  }

  push(message:string) {
    this._webContents.send("pushFilePath", message);
  }
}