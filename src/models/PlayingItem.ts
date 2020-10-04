export default class PlayingItem {
  id: number;
  title: string;
  startTimeString: string;
  isPlaying: boolean;

  constructor() {
    this.id = -1;
    this.title = "";
    this.startTimeString = "";
    this.isPlaying = false;
  }
}
