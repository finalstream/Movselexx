/* eslint-disable @typescript-eslint/no-explicit-any */
<template>
  <v-app id="inspire">
    <v-navigation-drawer v-model="isShowLeftNav" stateless clipped hide-overlay app>
      <v-tabs v-model="tab">
        <v-tab>Presets</v-tab>
        <v-tab>Groups</v-tab>
      </v-tabs>
      <v-tabs-items v-model="tab">
        <v-tab-item>
          <v-list>
            <v-list-item-group v-model="item" color="primary" mandatory>
              <template v-for="item in presetItems">
                <v-list-item
                  style="padding-left: 16px !important"
                  :key="item.text"
                  @click="updateFilterConditionPresets(item)"
                  dense
                >
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ item.text }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-list-item-group>
          </v-list>
        </v-tab-item>
        <v-tab-item>
          <v-list>
            <v-list-item-group v-model="selectedGroupIndex" color="primary" mandatory>
              <template v-for="group in groups">
                <v-list-item
                  style="padding: 0px 2px 0px 2px"
                  :key="group.groupId"
                  @click="updateFilterConditionGroup(group)"
                  @contextmenu="onGroupRowContextmenu"
                  dense
                >
                  <v-list-item-avatar>
                    <v-icon
                      color="orange darken-1"
                      @click="switchGroupRating(group)"
                      v-show="group.isFavorite"
                      >mdi-star</v-icon
                    >
                    <v-icon
                      color="grey lighten-1"
                      @click="switchGroupRating(group)"
                      v-show="!group.isFavorite"
                      >mdi-star-outline</v-icon
                    >
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title>
                      <v-icon small color="green lighten-1" v-show="group.isCompleted"
                        >mdi-check-circle</v-icon
                      >&nbsp;{{ group.groupName }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ group.fileSizeGB }} GB
                      <span v-for="drive in group.drives" :key="drive">
                        <v-chip
                          style="padding-left: 4px; padding-right: 4px; margin: 2px"
                          x-small
                          label
                          outlined
                          color="blue"
                          >{{ drive }}</v-chip
                        >
                      </span>
                    </v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-chip class="ma-2" x-small>{{ group.groupCount }}</v-chip>
                  </v-list-item-action>
                </v-list-item>
              </template>
            </v-list-item-group>
          </v-list>
        </v-tab-item>
      </v-tabs-items>
    </v-navigation-drawer>

    <v-navigation-drawer clipped app right permanent>
      <v-timeline align-top dense>
        <v-timeline-item
          v-for="nowPlaying in nowPlayings.filter((p) => !p.isSkip)"
          :key="nowPlaying.key"
          small
          fill-dot
          right
          class="pr-2"
        >
          <div style="margin-left: -40px">
            <strong>{{ nowPlaying.startTimeString }}</strong
            >&nbsp;<v-icon
              small
              style="margin-top: -5px"
              color="red accent-3"
              @click="removePlaying(nowPlaying)"
              >mdi-close-thick</v-icon
            >
          </div>
          <div style="margin-left: -40px" class="pl-3">
            <v-icon
              color="orange darken-1"
              v-show="nowPlaying.isFavorite"
              small
              style="z-index: 999"
              @click="switchRating(nowPlaying.library)"
              >mdi-star</v-icon
            >
            <v-icon
              color="grey lighten-1"
              v-show="!nowPlaying.isFavorite"
              small
              style="z-index: 999"
              @click="switchRating(nowPlaying.library)"
              >mdi-star-outline</v-icon
            >
            {{ nowPlaying.title }}
          </div>
        </v-timeline-item>
      </v-timeline>
    </v-navigation-drawer>

    <v-system-bar class="pr-0" id="titlebar" color="blue darken-3" app window>
      <span class="drag-region" style="color: white; width: 100%; padding-top: 5px">Movselexx</span>
      <v-spacer></v-spacer>
      <v-btn class="windowcontrol pl-2" icon tile
        ><v-icon small style="color: white" @click="showSettings()">mdi-cog</v-icon></v-btn
      >
      <v-btn class="windowcontrol pl-2" icon tile @click="minimizeWindow()"
        ><v-icon small style="color: white; text-align: center">mdi-minus</v-icon></v-btn
      >
      <v-btn class="windowcontrol pl-2" icon tile @click="maximizeWindow()"
        ><v-icon small style="color: white">mdi-checkbox-blank-outline</v-icon></v-btn
      >
      <v-btn class="windowcontrol pl-2" icon tile
        ><v-icon small style="color: white" @click="closeWindow()">mdi-close</v-icon></v-btn
      >
    </v-system-bar>
    <v-app-bar style="user-select: none" clipped-left clipped-right app>
      <v-app-bar-nav-icon @click.stop="switchShowLeftNav()"></v-app-bar-nav-icon>
      <v-toolbar-title class="ml-0 pl-2">
        <div style="display: flex">
          <div>
            <v-chip
              v-show="playInfo.getSeason() != ''"
              class="ma-2 pa-2"
              color="primary"
              label
              outlined
              @click="setSeasonSearchKeyword(playInfo)"
            >
              {{ playInfo.getSeason() }}
            </v-chip>
          </div>

          <div class="pt-1">
            <v-icon
              color="orange darken-1"
              @click="switchRating(playInfo.library)"
              v-show="playInfo.hasLibrary && playInfo.isFavorite"
              >mdi-star</v-icon
            >
            <v-icon
              color="grey lighten-1"
              @click="switchRating(playInfo.library)"
              v-show="playInfo.hasLibrary && !playInfo.isFavorite"
              >mdi-star-outline</v-icon
            >
          </div>
          <!--<span class="pl-3">{{ playInfo.getTitle() }}</span>-->
          <div>
            <div
              class="caption pl-3"
              style="color: lightslategray"
              @click="setGroupNameSearchKeyword(playInfo)"
            >
              {{ playInfo.getGroupName() }}
            </div>
            <div class="pl-3" style="margin-top: -7px">{{ playInfo.getTitle() }}</div>
          </div>
        </div>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-title style="width: 300px; text-align: right" class="ml-0 pr-5">
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <span class="hidden-sm-and-down" v-bind="attrs" v-on="on"
              >{{ playInfo.positionString }} / {{ playInfo.durationString }}</span
            >
          </template>
          <span>{{ getCountUpRemainTimeString() }}</span>
        </v-tooltip>
      </v-toolbar-title>
      <v-btn large icon @click="refresh()">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <router-view
          :filterCondition="filterCondition"
          @update-play-info="updatePlayInfo"
          @update-playing-info="updatePlayingInfo"
          @update-progress-info="updateProgressInfo"
          @update-groups="updateGroups"
          ref="main"
        ></router-view>
      </v-container>
    </v-main>

    <v-footer style="z-index: 8" app>
      <v-container v-show="isProgress" fluid class="mt-2 mb-2 pa-0">
        <span>{{ progressMessage }}</span>
        <v-progress-linear
          v-show="isProgress"
          color="orange accent-4"
          indeterminate
          rounded
          height="6"
        ></v-progress-linear>
      </v-container>
      <v-container fluid>
        <v-row>
          <v-col cols="1" class="pa-0 px-1">
            <v-btn color="primary" block @click="saveScreenShot()">
              <v-icon>mdi-camera</v-icon>
            </v-btn>
          </v-col>
          <v-col class="pa-0 px-1">
            <v-btn color="primary" @click="throwPlay()" block
              ><v-icon class="pr-1">mdi-movie-open</v-icon>Play</v-btn
            >
          </v-col>
          <v-col class="pa-0 px-1">
            <v-btn color="primary" @click="shuffle()" block
              ><v-icon class="pr-1">mdi-shuffle-variant</v-icon>Shuffle</v-btn
            >
          </v-col>
          <v-col cols="1" class="pa-0 px-1">
            <v-btn color="primary" @click="prevPlay()" block
              ><v-icon>mdi-skip-previous</v-icon></v-btn
            >
          </v-col>
          <v-col cols="1" class="pa-0 px-1">
            <v-btn color="primary" @click="nextPlay()" block><v-icon>mdi-skip-next</v-icon></v-btn>
          </v-col>
          <v-col cols="1" class="pa-0 px-1">
            <v-btn color="primary" @click="toggleMute()" block
              ><v-icon v-show="!playInfo.isMuted">mdi-volume-high</v-icon
              ><v-icon v-show="playInfo.isMuted">mdi-volume-off</v-icon></v-btn
            >
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
    <!--
    <v-btn bottom color="pink" dark fab fixed right @click="dialog = !dialog">
      <v-icon>mdi-plus</v-icon>
    </v-btn>
    <v-dialog v-model="dialog" width="800px">
      <v-card>
        <v-card-title class="grey darken-2">
          Create contact
        </v-card-title>
        <v-container>
          <v-row class="mx-2">
            <v-col class="align-center justify-space-between" cols="12">
              <v-row align="center" class="mr-0">
                <v-avatar size="40px" class="mx-3">
                  <img
                    src="//ssl.gstatic.com/s2/oz/images/sge/grey_silhouette.png"
                    alt=""
                  />
                </v-avatar>
                <v-text-field placeholder="Name"></v-text-field>
              </v-row>
            </v-col>
            <v-col cols="6">
              <v-text-field
                prepend-icon="mdi-account-card-details-outline"
                placeholder="Company"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field placeholder="Job title"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                prepend-icon="mdi-mail"
                placeholder="Email"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                type="tel"
                prepend-icon="mdi-phone"
                placeholder="(000) 000 - 0000"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                prepend-icon="mdi-text"
                placeholder="Notes"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
        <v-card-actions>
          <v-btn text color="primary">More</v-btn>
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="dialog = false">Cancel</v-btn>
          <v-btn text @click="dialog = false">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    -->
    <v-dialog
      v-model="isShowSettingDailog"
      fullscreen
      hide-overlay
      transition="dialog-bottom-transition"
      scrollable
    >
      <v-card tile>
        <v-toolbar flat dark color="primary">
          <v-btn icon dark @click="isShowSettingDailog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>Settings</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn dark text @click="saveSettings()"> Save </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <v-card-text>
          <v-list three-line subheader>
            <v-subheader>General</v-subheader>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Player</v-list-item-title>
                <v-list-item-subtitle>Now Only Support Media Player Classic</v-list-item-subtitle>
                <v-list-item-subtitle>
                  <v-combobox readonly v-model="players" :items="players"></v-combobox>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Media Player Classic EXE Path</v-list-item-title>
                <v-list-item-subtitle></v-list-item-subtitle>
                <v-list-item-subtitle>
                  <div style="display: inline-flex; width: 100%">
                    <v-text-field readonly v-model="appStore.mpcExePath"></v-text-field>
                    <v-btn class="mt-3 ml-3" @click="selectFileDialog()">...</v-btn>
                  </div>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Media Player Classic Port</v-list-item-title>
                <v-list-item-subtitle></v-list-item-subtitle>
                <v-list-item-subtitle>
                  <v-text-field
                    style="width: 100px"
                    type="number"
                    v-model="appStore.mpcPort"
                  ></v-text-field>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Play Display</v-list-item-title>
                <v-list-item-subtitle>
                  <v-combobox
                    v-model="playDisplay"
                    :item-text="getDisplayName"
                    item-value="no"
                    :items="displays"
                  ></v-combobox>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
          <v-divider></v-divider>
          <v-list three-line subheader>
            <v-subheader>XXXXXXX</v-subheader>
            <v-list-item>
              <v-list-item-action>
                <v-checkbox></v-checkbox>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>Notifications</v-list-item-title>
                <v-list-item-subtitle
                  >Notify me about updates to apps or games that I downloaded</v-list-item-subtitle
                >
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-checkbox></v-checkbox>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>Sound</v-list-item-title>
                <v-list-item-subtitle
                  >Auto-update apps at any time. Data charges may apply</v-list-item-subtitle
                >
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-action>
                <v-checkbox></v-checkbox>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>Auto-add widgets</v-list-item-title>
                <v-list-item-subtitle>Automatically add home screen widgets</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>

        <div style="flex: 1 1 auto"></div>
      </v-card>
    </v-dialog>
    <v-menu v-model="isShowMenu" :position-x="menuX" :position-y="menuY" absolute offset-y>
      <v-list dense>
        <v-list-item
          v-for="item in contextMenuDataGroupLists"
          :key="item.label"
          @click="onContextMenuClick(item.action)"
        >
          <v-list-item-title style="font-size: small">{{ item.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import electron from "electron";
import PlayInfo from "./models/PlayInfo";
import PlayingItem from "./models/PlayingItem";
import ArrayUtils from "firx/ArrayUtils";
import MovselexxAppStore from "./models/MovselexxAppStore";
import DisplayInfo from "./models/DisplayInfo";
import TimeSpan from "firx/TimeSpan";
import PlayItem from "./models/PlayItem";
import InitData from "./models/InitData";
import FilterCondition from "./models/FilterCondition";
import GroupItem from "./models/GroupItem";
import contextMenuDataGroupList from "./assets/contextMenuDataGroupList.json";

@Component
export default class App extends Vue {
  private ipcRenderer = electron.ipcRenderer;
  dialog = false;
  appStore: MovselexxAppStore;
  isShowLeftNav = false;
  item = null;
  players = ["Media Player Classic"];
  tab = null;
  presetItems: any[] = [
    /*
    {
      icon: "mdi-chevron-up",
      "icon-alt": "mdi-chevron-down",
      text: "Labels",
      model: true,
      children: [{ icon: "mdi-plus", text: "Create label" }],
    },
    {
      icon: "mdi-chevron-up",
      "icon-alt": "mdi-chevron-down",
      text: "More",
      model: false,
      children: [
        { text: "Import" },
        { text: "Export" },
        { text: "Print" },
        { text: "Undo changes" },
        { text: "Other contacts" },
      ],
    },
    { icon: "mdi-cog", text: "Settings" },
    { icon: "mdi-message", text: "Send feedback" },
    { icon: "mdi-help-circle", text: "Help" },
    { icon: "mdi-cellphone-link", text: "App downloads" },
    { icon: "mdi-keyboard", text: "Go to the old version" },
    */
  ];
  playInfo: PlayInfo;
  nowPlayings: PlayingItem[];
  isProgress: boolean;
  progressMessage: string;
  isShowSettingDailog: boolean;
  displays: DisplayInfo[];
  playDisplay: DisplayInfo;
  filterCondition: FilterCondition;
  groups: GroupItem[];
  isShowMenu = false;
  menuX = 0;
  menuY = 0;
  contextMenuDataGroupLists = contextMenuDataGroupList;
  selectedGroupIndex = 0;

  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.playInfo = new PlayInfo();
    this.appStore = new MovselexxAppStore();
    this.nowPlayings = [];
    this.isProgress = false;
    this.progressMessage = "";
    this.isShowSettingDailog = false;
    this.isShowLeftNav = false;
    this.displays = [];
    this.playDisplay = new DisplayInfo(1, { width: 0, height: 0 });
    this.filterCondition = new FilterCondition();
    this.groups = [];
  }

  async created() {
    document.onkeydown = (e) => {
      if (e.code == "F12") {
        console.log("switch debug mode");
        this.ipcRenderer.invoke("toggleDevTools");
      }
    };

    const initData: InitData = await this.ipcRenderer.invoke("initialize");

    this.loadSettings(initData.mpcExePath, initData.playDisplayNo);

    // load filters
    for (const filter of initData.filters) {
      this.presetItems.push(filter);
    }

    let no = 1;
    for (const d of initData.displays) {
      this.displays.push(new DisplayInfo(no++, d.size));
    }

    if (this.displays.length > 0) {
      this.playDisplay = this.displays.filter((d) => d.no == this.appStore.playDisplayNo)[0];
    }
  }

  mounted() {
    //
    //this.$vuetify.theme.dark = true;
    this.$nextTick(() => {
      this.getMainVue().initPlayController();
    });
  }

  minimizeWindow() {
    this.ipcRenderer.invoke("minimizeWindow");
  }

  maximizeWindow() {
    this.ipcRenderer.invoke("maximizeWindow");
  }

  closeWindow() {
    this.ipcRenderer.invoke("closeWindow");
  }

  async selectFileDialog() {
    const path = await this.ipcRenderer.invoke("openDialogfile");
    if (path == undefined) return;
    this.appStore.mpcExePath = path;
  }

  test() {
    //
    console.log("test");
  }

  updatePlayInfo(playInfo: PlayInfo) {
    this.playInfo.update(playInfo);
  }

  updatePlayingInfo(playingInfos: PlayingItem[]) {
    ArrayUtils.clear(this.nowPlayings);
    playingInfos.forEach((pi) => {
      this.nowPlayings.push(pi);
    });
  }

  updateProgressInfo(isProgress: boolean, message: string) {
    this.isProgress = isProgress;
    this.progressMessage = message;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getMainVue(): any {
    return this.$refs.main;
  }

  saveScreenShot() {
    this.getMainVue().saveScreenShot();
  }

  throwPlay() {
    this.getMainVue().throwPlay();
  }

  shuffle() {
    this.getMainVue().reloadPlayItems(true);
  }

  nextPlay() {
    this.getMainVue().playNext();
  }

  prevPlay() {
    this.getMainVue().playPrev();
  }

  refresh() {
    this.getMainVue().refresh();
  }

  toggleMute() {
    this.getMainVue().toggleMute();
  }

  showSettings() {
    this.isShowSettingDailog = true;
  }

  setGroupNameSearchKeyword(playInfo: PlayInfo) {
    this.getMainVue().setSearchKeyword(playInfo.getGroupName());
  }

  setSeasonSearchKeyword(playInfo: PlayInfo) {
    this.getMainVue().setSearchKeyword(playInfo.getSeason());
  }

  getCountUpRemainTimeString() {
    if (!this.getMainVue()) return "";
    const countUpRemainMs = this.getMainVue().getCountUpRemainMs();
    if (countUpRemainMs == null) return "No Match Library";
    const countUpRemain = new TimeSpan(countUpRemainMs);
    let str = "Remain CountUp ";

    if (Math.floor(countUpRemain.totalHours) > 0) str += countUpRemain.hours + " hour ";
    if (Math.floor(countUpRemain.totalMinutes) > 0) {
      str += countUpRemain.minutes + " min ";
      str += countUpRemain.seconds + " sec";
    } else {
      str += countUpRemain.seconds + " sec";
    }
    return str;
  }

  loadSettings(mpcExePath: string, playDisplayNo: number) {
    this.appStore.mpcExePath = mpcExePath;
    this.appStore.playDisplayNo = playDisplayNo;
  }

  async saveSettings() {
    await this.ipcRenderer.invoke("setStore", "mpcExePath", this.appStore.mpcExePath);
    await this.ipcRenderer.invoke("setStore", "playDisplayNo", this.playDisplay.no);
    this.isShowSettingDailog = false;
  }

  switchShowLeftNav() {
    this.isShowLeftNav = !this.isShowLeftNav;
  }

  async switchRating(item: PlayItem) {
    if (!item) return;
    const id = item.id;
    console.log("switchRating", id, !item.isFavorite);
    const rating = await this.ipcRenderer.invoke("switchRating", id, !item.isFavorite);
    item.rating = rating;
  }

  async switchGroupRating(item: GroupItem) {
    if (!item) return;
    const gid = item.groupId;
    console.log("switchGroupRating", gid, !item.isFavorite);
    const rating = await this.ipcRenderer.invoke("switchGroupRating", gid, !item.isFavorite);
    item.groupRating = rating;
    this.updateFilterConditionGroup(item);
  }

  removePlaying(nowPlaying: PlayingItem) {
    console.log("removePlaying", nowPlaying);
    this.getMainVue().removePlaying(nowPlaying);
  }

  getDisplayName(display: DisplayInfo) {
    return "Display " + display.no + " (" + display.size.width + "x" + display.size.height + ")";
  }

  updateFilterConditionPresets(filter: any) {
    console.log("updateFilterConditionPresets", filter.sql, filter.isFullSql, filter.isLimited);
    this.filterCondition.updatePresets(filter.sql, filter.isFullSql, filter.isLimited);
    this.getMainVue().reloadPlayItems();
  }

  updateFilterConditionGroup(group: GroupItem) {
    console.log("updateFilterConditionGroup", group);
    this.filterCondition.updateGroup(group);
    this.getMainVue().reloadPlayItems();
  }

  updateGroups(groups: GroupItem[]) {
    // TODO: 配列の中身を差し替えるArrayUtilsを作成する
    ArrayUtils.clear(this.groups);
    for (const group of groups) {
      this.groups.push(group);
    }
  }

  onGroupRowContextmenu(event: MouseEvent) {
    event.preventDefault();
    this.isShowMenu = false;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.$nextTick(() => {
      this.isShowMenu = true;
    });
  }

  async onContextMenuClick(action: string) {
    const selectItems = this.groups[this.selectedGroupIndex];
    console.log("contextMenuClick", action, selectItems);

    switch (action) {
      case "editGroup": {
        break;
      }
      default:
        break;
    }
  }

  /*
  switchFunctionGroup(key: string, keyPath: string) {
    console.log("switchFunctionGroup", key, keyPath);

    if (key == this.activeFunctionGroupIndex) return;


    switch (key) {
      case "1":
        this.$router.push("/");
        break;
      case "2":
        this.$router.push("/ReceiveBox");
        break;
      default:
        break;
    }

    this.activeFunctionGroupIndex = key;
  }
*/
}
</script>
<style scoped>
.drag-region {
  width: 100%;
  height: 100%;
  -webkit-app-region: drag;
}

.windowcontrol::before {
  background-color: #ffffff;
}

.v-sheet.v-app-bar.v-toolbar:not(.v-sheet--outlined) {
  box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14),
    0px 1px 10px 0px rgba(0, 0, 0, 0.12);
}
</style>
<style>
html {
  overflow-y: hidden !important;
}

.v-timeline-item--fill-dot .v-timeline-item__inner-dot {
  height: 16px !important;
  margin: 0;
  width: 16px !important;
}

.v-timeline-item__dot--small {
  height: 16px !important;
  left: calc(50% - 12px);
  width: 16px !important;
}

.v-timeline-item__divider {
  position: relative;
  min-width: 72px !important;
  display: flex;
  /*align-items: center;*/
  justify-content: normal !important;
  z-index: 1;
}

.v-application--is-ltr .v-timeline--dense:not(.v-timeline--reverse):before {
  left: calc(32px - 1px) !important;
  right: initial;
}

.v-list-item__avatar {
  margin-right: 0px !important;
}

.v-list-item__action {
  margin-left: 0px !important;
}
</style>
