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
    { text: "No", align: "start", value: "no" },
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

  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.items = [];
    this.showSnackbar = false;
  }

  async created() {
    await this.ipcRenderer.invoke("initialize");
    this.refresh();
    this.mpcClient = new MpcClient("localhost", 13579);
    this.mpcClient.connect();

    setInterval(() => {
      this.mpcClient.getPlayInfo().then((pi) => {
        console.log(pi);
        this.$emit("update-play-info", pi);
      });
    }, 1000);

    //const res = await this.ipcRenderer.invoke("getStore", "searchDirectory");
    //if (res) this.mainData.searchDirectory = res;
  }

  mounted() {
    //this.ipcRenderer.invoke("ready");
  }

  async rowDbClick(e: any, value: any) {
    const item: PlayItem = value.item;
    console.log(item.filePath);

    this.mpcClient.openFile(item.filePath);

    let currentTime = new Date();
    let currentTimeSpan = TimeSpan.fromMilliseconds(currentTime.getTime());
    const playings = this.items.map((item) => {
      const pi = new PlayingItem();
      pi.id = item.id;
      pi.title = item.title;
      const durationSpan = TimeSpan.parse(item.length);
      currentTime = new Date(
        currentTimeSpan.add(durationSpan).totalMilliseconds
      );
      currentTimeSpan = TimeSpan.fromMilliseconds(currentTime.getTime());
      pi.startTimeString = DateFormat(currentTime, "HH:MM");
      return pi;
    });
    this.$emit("update-playing-info", playings);
  }

  async refresh() {
    console.log("refresh");
    const rows: IPlayItem[] = await this.ipcRenderer.invoke("getLibrary");
    this.updatePlayItems(rows);
    console.log(rows);
  }

  updatePlayItems(rows: IPlayItem[]) {
    ArrayUtils.clear(this.items);
    rows.forEach((r) => this.items.push(new PlayItem(r)));
  }

  async saveScreenShot() {
    this.showSnackbar = false;
    await this.mpcClient.saveScreenShot();
    this.showSnackbar = true;
  }
}
</script>
