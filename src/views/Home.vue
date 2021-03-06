<template src="./Home.html"></template>

<script lang="ts">
import { IPlayItem } from "@/models/IPlayItem";
import PlayItem from "@/models/PlayItem";
import electron, { TouchBarButton } from "electron";
import { Vue, Component, Watch, Prop } from "vue-property-decorator";
import ArrayUtils from "firx/ArrayUtils";
import { MessageLevel } from "firx/MessageLevel";
import MpcClient from "@/models/MpcClient";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Vuetify from "vuetify";
import PlayController from "@/models/PlayController";
import { RatingType } from "@/models/RatingType";
import contextMenuDataPlayList from "../assets/contextMenuDataPlayList.json";
import PlayingItem from "@/models/PlayingItem";
import FilterCondition from "@/models/FilterCondition";
import { IGroupItem } from "@/models/IGroupItem";
import GroupItem from "@/models/GroupItem";

@Component
export default class Home extends Vue {
  private ipcRenderer = electron.ipcRenderer;

  @Prop()
  filterCondition!: FilterCondition;

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
    { text: "No", align: "end", value: "no", width: "70px" },
    { text: "Length", align: "end", value: "length", sortable: false },
    { text: "", align: "center", value: "rating" },

    { text: "Date", value: "date", width: "120px" },
    { text: "Video", align: "center", value: "video", sortable: false },
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
  itemListHeight = 300;
  sortBy = "";
  isCtrlKeyDown = false;
  isShowGroupingDialog = false;
  groupingGroup: PlayItem | null = null;
  groupingNewGroupName = "";
  groupingKeyword = "";
  isGroupingAllNoGroup = false;

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
      if (e.dataTransfer == null) return;
      e.dataTransfer.dropEffect = "copy";
      e.preventDefault();
      return false;
    };

    document.ondrop = e => {
      const drops = [];
      if (e.dataTransfer == null) return;
      for (const i in e.dataTransfer.files) {
        if (Object.prototype.hasOwnProperty.call(e.dataTransfer.files, i)) {
          const element = e.dataTransfer.files[i];
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
    const connected = await this.mpcClient.connect();

    if (!connected) {
      // resume play
      console.log("resume play");
      await this.mpcClient.resumePlay();
    }

    setInterval(() => {
      this.mpcClient.getPlayInfo().then(async pi => {
        if (pi == null) return;
        //console.log(pi);
        this.$emit("update-play-info", pi);

        if (pi.library != null) {
          // ライブラリ内にある場合
          const library = pi.library;
          const itemIndex = this.items.findIndex(i => i.id == library.id);
          this.items.forEach(i => (i.isPlaying = false));

          if (itemIndex != -1) {
            // グリッドにあればグリッドの情報を更新
            const item = this.items[itemIndex];
            item.rating = library.rating;
            item.playCount = library.playCount;
            item.lastPlayDate = new Date(library.lastPlayDate);
            item.isPlaying = true;
          }
          this.playController.updateRating(library.id, library.rating);

          const isUpdatePlayings = await this.playController.monitoring(pi);
          if (isUpdatePlayings) await this.updatePlayingList();
        }
      });
    }, 1000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getGridItemListVue(): any {
    return this.$refs.gridItemList;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async rowClick(e: MouseEvent) {
    const elem: any = e.currentTarget!;
    const key = elem.dataset!.key;

    const clickItem = this.items.filter(item => item.key == key);

    console.log("selectItem", e, clickItem[0]);

    const item: PlayItem = clickItem[0];
    if ((!e.ctrlKey && e.button != 2) || (e.button == 2 && !item.isSelected)) {
      // clear selection
      for (let index = 0; index < this.items.length; index++) {
        const element = this.items[index];
        element.isSelected = false;
      }
    }
    item.isSelected = true;

    if (e.button == 2) {
      // right click
      this.isShowMenu = false;
      this.menuX = e.clientX;
      this.menuY = e.clientY;
      this.$nextTick(() => {
        this.isShowMenu = true;
      });
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async rowDbClick(e: MouseEvent) {
    const elem: any = e.currentTarget!;
    const key = elem.dataset!.key;

    const clickItem = this.items.filter(item => item.key == key);

    const item: PlayItem = clickItem[0];
    console.log(item.filePath);

    const isNearEnd = this.playController.isNearEnd();
    const removeId = isNearEnd ? this.playController.playingId : -1;
    this.mpcClient.openFile(item.filePath, false);

    this.addPlayingItems([item], true, false, removeId);
  }

  addPlayingItems(items: PlayItem[], isAdd: boolean, isRebuild: boolean, removeId?: number) {
    this.playController.addPlayingItems(items, isAdd, isRebuild, removeId);
    this.updatePlayingList();
  }

  async reloadPlayItems(isShuffle = false) {
    console.log(
      "reloadPlayItems",
      this.searchKeyword,
      isShuffle,
      this.isOnlyFavorite,
      this.filterCondition
    );
    const rows: IPlayItem[] = await this.ipcRenderer.invoke(
      "getLibraries",
      this.searchKeyword,
      isShuffle,
      this.isOnlyFavorite ? RatingType.Favorite : RatingType.Normal,
      this.filterCondition
    );
    this.updatePlayItems(rows);
    const grows: IGroupItem[] = await this.ipcRenderer.invoke(
      "getGroups",
      this.isOnlyFavorite ? RatingType.Favorite : RatingType.Normal
    );
    this.$emit(
      "update-groups",
      grows.map(r => new GroupItem(r))
    );
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

  toggleMute() {
    this.mpcClient.toggleMute();
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

  updatePlayingList() {
    this.$emit(
      "update-playing-info",
      this.playController.playings.filter(p => !p.isSkip)
    );
    return this.ipcRenderer.invoke(
      "updatePlayingList",
      this.playController.lastMakePlayings.filter(p => !p.isSkip)
    );
  }

  async grouping() {
    const selectItems = this.items.filter(i => i.isSelected);
    const targetIds = selectItems.map(i => i.id);
    let groupId = this.groupingGroup?.groupId;
    const groupName = this.groupingGroup?.groupName;
    console.log("grouping", this.isGroupingAllNoGroup, groupId, targetIds);
    if (this.isGroupingAllNoGroup) {
      // regist Group
      groupId = await this.ipcRenderer.invoke(
        "registGroup",
        this.groupingNewGroupName,
        this.groupingKeyword
      );
    }
    await this.ipcRenderer.invoke("joinGroup", groupId, targetIds);
    for (const item of selectItems) {
      if (groupId) item.groupId = groupId;
      if (groupName) item.groupName = groupName;
    }
  }

  getCountUpRemainMs() {
    return this.playController.getCountUpRemainMs();
  }

  getGroupingGroups() {
    return this.items.filter((v, i, a) => {
      return v.groupName != null && a.findIndex(vs => vs.groupId == v.groupId) == i;
    });
  }

  removePlaying(playingItem: PlayingItem) {
    this.playController.setSkip(playingItem);
    this.playController.calcStartTime();
    this.updatePlayingList();
    if (this.playController.playingId == playingItem.id) this.playNext();
  }

  rowClasses(item: PlayItem) {
    return item.isSelected ? "v-data-table__selected" : "";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    this.rowClick(event);
    this.isShowMenu = false;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.$nextTick(() => {
      this.isShowMenu = true;
    });
  }

  async onContextMenuClick(action: string) {
    const selectItems = this.items.filter(i => i.isSelected);
    console.log("contextMenuClick", action, selectItems);

    switch (action) {
      case "reserveNext": {
        const selectItem = selectItems[0];
        this.playController.reserveNext(selectItem);
        this.updatePlayingList();
        break;
      }
      case "grouping": {
        const selectItem = selectItems[0];
        this.groupingGroup = selectItem;

        this.isGroupingAllNoGroup = selectItems.every(g => g.groupId == null);

        if (this.isGroupingAllNoGroup) {
          this.groupingKeyword = await this.ipcRenderer.invoke("getGroupKeyword", selectItem.title);
          this.groupingNewGroupName = this.groupingKeyword;
          this.groupingGroup = this.getGroupingGroups().find(
            g => g.groupName == this.groupingKeyword
          )!;
          this.isGroupingAllNoGroup = !this.getGroupingGroups().some(
            i => i.groupName == this.groupingKeyword
          );
        }

        this.isShowGroupingDialog = true;
        break;
      }
      case "filterGroup": {
        const selectItem = selectItems[0];
        this.setSearchKeyword(selectItem.groupName);
        break;
      }
      case "unGroup": {
        await this.ipcRenderer.invoke(
          "unGroupLibrary",
          selectItems.map(i => i.id)
        );
        for (const item of selectItems) {
          item.groupId = null;
          item.groupName = "";
        }
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

  async onHomeResized() {
    const winSize: number[] = await this.ipcRenderer.invoke("getWindowSize");
    console.log("homeResized", winSize);
    this.itemListHeight = winSize[1] - 260;
  }

  @Watch("isOnlyFavorite")
  onChangeIsOnlyFavorite() {
    this.reloadPlayItems();
  }

  @Watch("searchKeyword")
  onChangeSearchKeyword() {
    console.log("ChangeSearchKeyword", this.searchKeyword);
    if (!this.searchKeyword) this.sortBy = "";
    this.reloadPlayItems();
  }
}
</script>
