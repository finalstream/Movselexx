<template src="./Home.html"></template>

<script lang="ts">
import { IPlayItem } from "@/models/IPlayItem";
import PlayItem from "@/models/PlayItem";
import electron from "electron";
import { Vue, Component } from "vue-property-decorator";
import ArrayUtils from "firx/ArrayUtils";

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
    {
      text: "Group",
      align: "start",
      sortable: false,
      value: "groupName",
    },
    { text: "Title", align: "start", value: "title" },
    { text: "No", align: "start", value: "no" },
    { text: "Length", align: "start", value: "length" },
    { text: "", align: "center", value: "isFavorite" },

    { text: "Date", value: "date" },
    { text: "VideoSize", value: "videoSize", sortable: false },
    { text: "D", value: "drive", sortable: false },
    { text: "Cnt", value: "playCount", sortable: false },
    { text: "", align: "center", value: "isPlayed" },
  ];
  items: PlayItem[];

  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.items = [];
  }

  async created() {
    await this.ipcRenderer.invoke("initialize");
    const rows = await this.ipcRenderer.invoke("getLibrary");
    //const res = await this.ipcRenderer.invoke("getStore", "searchDirectory");
    //if (res) this.mainData.searchDirectory = res;
  }

  mounted() {
    //this.ipcRenderer.invoke("ready");
  }

  rowDbClick(e: any, value: any) {
    console.log(value);
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
}
</script>
