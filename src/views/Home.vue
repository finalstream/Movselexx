<template src="./Home.html"></template>

<script lang="ts">
import { IPlayItem } from "@/models/IPlayItem";
import PlayItem from "@/models/PlayItem";
import electron from "electron";
import { Vue, Component, Watch } from "vue-property-decorator";
import ArrayUtils from "firx/ArrayUtils";
import { MessageLevel } from "firx/MessageLevel";
import MpcClient from "@/models/MpcClient";

import PlayController from "@/models/PlayController";
import { RatingType } from "@/models/RatingType";
import contextMenuDataPlayList from "../assets/contextMenuDataPlayList.json";
import App from "@/App.vue";

@Component
export default class Home extends Vue {
  private ipcRenderer = electron.ipcRenderer;

  headers = [
    {
      text: "",
      align: "start",
      sortable: false,
      value: "isPlaying",
      width: "60px",
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
    { text: "", align: "center", value: "rating" },

    { text: "Date", value: "date" },
    { text: "VideoSize", value: "videoSize", sortable: false },
    { text: "D", value: "drive", sortable: false },
    { text: "Cnt", value: "playCount", align: "end", sortable: false },
    { text: "", align: "center", value: "isPlayed" },
  ];
  items: PlayItem[];
  mpcClient!: MpcClient;
  isShowSnackbar: boolean;
  snackbarMessageLevel: MessageLevel;
  snackbarMessage: string;
  playController!: PlayController;
  menuX = 0;
  menuY = 0;
  isShowMenu = false;
  contextMenuDataPlayLists = contextMenuDataPlayList;
  isShowDeleteLibraryDialog = false;
  isShowDeleteFileDialog = false;
  deleteSelectItems: PlayItem[] = [];
  searchKeyword: string;
  isOnlyFavorite = false;

  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.items = [];
    this.isShowSnackbar = false;
    this.snackbarMessageLevel = MessageLevel.Success;
    this.snackbarMessage = "";
    this.searchKeyword = "";
  }

  async created() {
    document.ondragover = document.ondrop = e => {
      e.dataTransfer!.dropEffect = "copy";
      e.preventDefault();
      return false;
    };
    document.ondrop = e => {
      const drops = [];
      for (const i in e.dataTransfer!.files) {
        if (Object.prototype.hasOwnProperty.call(e.dataTransfer!.files, i)) {
          const element = e.dataTransfer!.files[i];
          drops.push(element.path);
        }
      }
      console.log("file dropped:", drops);
      this.$emit("update-progress-info", true);
      this.ipcRenderer.invoke("registLibrary", drops);
    };

    this.refresh();
    this.mpcClient = new MpcClient(this.getAppStore(), "localhost", 13579);
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
        if (pi == null) return;
        //console.log(pi);
        this.$emit("update-play-info", pi);
        if (pi.library != null) {
          const library = pi.library;
          const itemIndex = this.items.findIndex(i => i.id == library.ID);
          this.items.forEach(i => (i.isPlaying = false));
          if (itemIndex != -1) {
            const item = this.items[itemIndex];
            item.rating = library.RATING;
            item.playCount = library.PLAYCOUNT;
            item.isPlaying = true;
          }

          const isUpdatePlayings = this.playController.monitoring(pi);
          if (isUpdatePlayings) this.$emit("update-playing-info", this.playController.playings);
        }
      });
    }, 1000);

    this.ipcRenderer.on("pushProgressInfo", async (event, message: string, detail: any) => {
      if (message == "#REGIST-END#") {
        this.$emit("update-progress-info", false);
        const registedCount: number = detail;
        if (registedCount > 0) this.showSnackbar(registedCount + " 件 登録しました");
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

  getAppStore() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const root: any = this.$root.$children[0];
    return root.appStore;
  }

  getGridItemListVue(): any {
    return this.$refs.gridItemList;
  }

  async rowClick(e: any, value: any) {
    console.log("selectItem", value.item);
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

  async reloadPlayItems(searchKeyword = "", isShuffle = false) {
    const rows: IPlayItem[] = await this.ipcRenderer.invoke(
      "getLibraries",
      searchKeyword,
      isShuffle,
      this.isOnlyFavorite ? RatingType.Favorite : RatingType.Normal
    );
    this.updatePlayItems(rows);
  }

  throwPlay() {
    let throwItems: PlayItem[] = [];
    let isStarted = false;
    // ソートされた場合、Itemsではソートどおりに取得できないため、selectableItemsから取得する
    for (const item of this.getGridItemListVue().selectableItems) {
      if (item.isSelected) isStarted = true;
      if (isStarted) throwItems.push(item);
    }
    if (throwItems.length == 0) throwItems = throwItems.concat(this.items);

    this.addPlayingItems(throwItems, false, true);
    if (throwItems.length > 0) {
      this.mpcClient.openFile(throwItems[0].filePath, false);
    }
  }

  playNext() {
    this.playController.playNext(true);
  }

  playPrev() {
    this.playController.playPrev();
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
    this.$nextTick(async () => {
      await this.mpcClient.saveScreenShot();
    });
    this.showSnackbar("スクリーンショットを保存しました");
  }

  showSnackbar(message: string, level: MessageLevel = MessageLevel.Success) {
    this.snackbarMessageLevel = level;
    this.snackbarMessage = message;
    this.isShowSnackbar = true;
  }

  async switchRating(playItem: PlayItem) {
    console.log("switchRating", playItem.id, !playItem.isFavorite);
    const rating = await this.ipcRenderer.invoke("switchRating", playItem.id, !playItem.isFavorite);
    playItem.rating = rating;
  }

  async switchPlayed(playItem: PlayItem) {
    console.log("switchPlayed", playItem.id, !playItem.isPlayed);
    const isPlayed = await this.ipcRenderer.invoke("switchPlayed", playItem.id, !playItem.isPlayed);
    playItem.isPlayed = isPlayed;
  }

  async deleteLibrary(isFileDelete: boolean) {
    console.log("deleteLibrary", isFileDelete, this.deleteSelectItems);
    await this.ipcRenderer.invoke("deleteLibrary", isFileDelete, this.deleteSelectItems);
    for (const deleteItem of this.deleteSelectItems) {
      const deleteIndex = this.items.findIndex(v => v.id == deleteItem.id);
      if (deleteIndex != -1) {
        this.items.splice(deleteIndex, 1);
      }
    }
  }

  setSearchKeyword(keyword: string) {
    this.searchKeyword = keyword;
  }

  getCountUpRemainMs() {
    return this.playController.getCountUpRemainMs();
  }

  rowClasses(item: PlayItem) {
    return item.isSelected ? "v-data-table__selected" : "";
  }

  onRowContextmenu(event: MouseEvent, data: any) {
    event.preventDefault();
    /*
    this.items = Object.entries(data)
      .map(([key, value]) => {
        return {
          title: `${key}: ${
            typeof value === "function" ? value.toString() : JSON.stringify(value)
          }`,
        };
      })
      .sort((item1, item2) => item1.title.localeCompare(item2.title));
      */
    this.rowClick(event, data);
    this.isShowMenu = false;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.$nextTick(() => {
      this.isShowMenu = true;
    });
  }

  onContextMenuClick(action: string) {
    const selectItems = this.items.filter(i => i.isSelected);
    console.log("contextMenuClick", action, selectItems);

    switch (action) {
      case "filterGroup": {
        const selectItem = selectItems[0];
        this.setSearchKeyword(selectItem.groupName);
        break;
      }
      case "deleteLibrary": {
        ArrayUtils.clear(this.deleteSelectItems);
        this.deleteSelectItems = this.deleteSelectItems.concat(selectItems);
        this.isShowDeleteLibraryDialog = true;
        break;
      }
      default:
        break;
    }
  }

  @Watch("isOnlyFavorite")
  onChangeIsOnlyFavorite() {
    this.reloadPlayItems();
  }

  @Watch("searchKeyword")
  onChangeSearchKeyword() {
    console.log("ChangeSearchKeyword", this.searchKeyword);
    this.reloadPlayItems(this.searchKeyword);
  }
}
</script>
