<template src="./Home.html"></template>

<script lang="ts">
import { IPlayItem } from "@/models/IPlayItem";
import PlayItem from "@/models/PlayItem";
import electron from "electron";
import { Vue, Component } from "vue-property-decorator";
import ArrayUtils from "firx/ArrayUtils";
import MpcClient from "@/models/MpcClient";
import PlayingItem from "@/models/PlayingItem";

import PlayController from "@/models/PlayController";

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
  mpcClient!: MpcClient;
  showSnackbar: boolean;
  playController!: PlayController;

  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.items = [];
    this.showSnackbar = false;
  }

  async created() {
    this.refresh();
    this.mpcClient = new MpcClient("localhost", 13579);
    this.playController = new PlayController(this.mpcClient);
    const playingItems: IPlayItem[] = await this.ipcRenderer.invoke("getPlayingList");
    this.addPlayingItems(
      playingItems.map(p => new PlayItem(p)),
      false,
      true
    );
    this.mpcClient.connect();

    setInterval(() => {
      this.mpcClient.getPlayInfo().then(pi => {
        //console.log(pi);
        this.$emit("update-play-info", pi);
        const isUpdatePlayings = this.playController.monitoring(pi);
        if (isUpdatePlayings) this.$emit("update-playing-info", this.playController.playings);
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

    this.mpcClient.openFile(item.filePath, false);

    this.addPlayingItems([item], true, false);
  }

  addPlayingItems(items: PlayItem[], isAdd: boolean, isRebuild: boolean) {
    this.playController.addPlayingItems(items, isAdd, isRebuild);
    this.ipcRenderer.invoke("updatePlayingList", this.playController.playings);
    this.$emit("update-playing-info", this.playController.playings);
  }

  async reloadPlayItems(isShuffle = false) {
    const rows: IPlayItem[] = await this.ipcRenderer.invoke("getLibraries", isShuffle);
    this.updatePlayItems(rows);
    console.log(rows);
  }

  throwPlay() {
    let throwItems: PlayItem[] = [];
    let isStarted = false;
    for (const item of this.items) {
      if (item.isSelected) isStarted = true;
      if (isStarted) throwItems.push(item);
    }
    if (throwItems.length == 0) throwItems = throwItems.concat(this.items);

    this.addPlayingItems(throwItems, false, true);
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
