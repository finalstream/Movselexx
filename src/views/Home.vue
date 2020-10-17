<template src="./Home.html"></template>

<script lang="ts">
import { IPlayItem } from "@/models/IPlayItem";
import PlayItem from "@/models/PlayItem";
import electron from "electron";
import { Vue, Component } from "vue-property-decorator";
import ArrayUtils from "firx/ArrayUtils";
import TimeSpan from "firx/TimeSpan";
import MpcClient from "@/models/MpcClient";
import PlayingItem from "@/models/PlayingItem";
import DateFormat from "dateformat";

@Component
export default class Home extends Vue {
  private ipcRenderer = electron.ipcRenderer;

  headers = [
    {
      text: "",
      align: "start",
      sortable: false,
      value: "isPlaying",
    },
    /*{
      text: "Group",
      align: "start",
      sortable: false,
      value: "groupName",
    },*/
    { text: "Title", align: "start", value: "title" },
    { text: "No", align: "end", value: "no" },
    { text: "Length", align: "end", value: "length" },
    { text: "", align: "center", value: "isFavorite" },

    { text: "Date", value: "date" },
    { text: "VideoSize", value: "videoSize", sortable: false },
    { text: "D", value: "drive", sortable: false },
    { text: "Cnt", value: "playCount", sortable: false },
    { text: "", align: "center", value: "isPlayed" },
  ];
  items: PlayItem[];
  playings: PlayingItem[];
  mpcClient!: MpcClient;
  showSnackbar: boolean;

  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.items = [];
    this.playings = [];
    this.showSnackbar = false;
  }

  async created() {
    this.refresh();
    this.mpcClient = new MpcClient("localhost", 13579);
    this.mpcClient.connect();

    setInterval(() => {
      this.mpcClient.getPlayInfo().then(pi => {
        //console.log(pi);
        this.$emit("update-play-info", pi);
        this.mpcClient.monitoring(pi);
      });
    }, 1000);

    this.ipcRenderer.on("pushProgressInfo", async (event, message: string) => {
      if (message == "#END#") {
        this.$emit("update-progress-info", false);
        this.reloadPlayItems();
        return;
      }
      console.log("filepath", message);
      this.$emit("update-progress-info", true, message);
    });
    //const res = await this.ipcRenderer.invoke("getStore", "searchDirectory");
    //if (res) this.mainData.searchDirectory = res;
  }

  mounted() {
    //this.ipcRenderer.invoke("ready");
  }

  async rowClick(e: any, value: any) {
    console.log(value.item);
    const item: PlayItem = value.item;
    for (let index = 0; index < this.items.length; index++) {
      const element = this.items[index];
      element.isSelected = false;
    }
    item.isSelected = true;
  }

  async rowDbClick(e: any, value: any) {
    const item: PlayItem = value.item;
    console.log(item.filePath);

    this.mpcClient.openFile(item.filePath);

    this.addPlayingItems([item], true);
  }

  async reloadPlayItems(isShuffle = false) {
    const rows: IPlayItem[] = await this.ipcRenderer.invoke("getLibraries", isShuffle);
    this.updatePlayItems(rows);
    console.log(rows);
  }

  addPlayingItems(items: PlayItem[], isAddHead = false) {
    let currentTime = new Date();
    let currentTimeSpan = TimeSpan.fromMilliseconds(currentTime.getTime());
    let count = 0;
    for (const item of items) {
      const pi = new PlayingItem();
      pi.id = item.id;
      pi.title = item.title;
      if (count != 0) {
        const durationSpan = TimeSpan.parse(item.length);
        currentTime = new Date(currentTimeSpan.add(durationSpan).totalMilliseconds);
        currentTimeSpan = TimeSpan.fromMilliseconds(currentTime.getTime());
      }
      pi.startTimeString = DateFormat(currentTime, "HH:MM");
      if (!isAddHead) {
        this.playings.push(pi);
      } else {
        this.playings.unshift(pi);
      }
      count++;
    }
    this.$emit("update-playing-info", this.playings);
  }

  throwPlay() {
    let throwItems: PlayItem[] = [];
    let isStarted = false;
    for (const item of this.items) {
      if (item.isSelected) isStarted = true;
      if (isStarted) throwItems.push(item);
    }
    if (throwItems.length == 0) throwItems = throwItems.concat(this.items);
    ArrayUtils.clear(this.playings);
    this.addPlayingItems(throwItems);
  }

  async refresh() {
    if (this.items.length == 0) {
      this.reloadPlayItems();
    } else {
      console.log("refresh");
      this.$emit("update-progress-info", true);
      this.ipcRenderer.invoke("updateLibrary", this.items);
    }
  }

  updatePlayItems(rows: IPlayItem[]) {
    ArrayUtils.clear(this.items);
    rows.forEach(r => this.items.push(new PlayItem(r)));
  }

  async saveScreenShot() {
    this.showSnackbar = false;
    await this.mpcClient.saveScreenShot();
    this.showSnackbar = true;
  }

  rowClasses(item: PlayItem) {
    return item.isSelected ? "v-data-table__selected" : "";
  }
}
</script>
