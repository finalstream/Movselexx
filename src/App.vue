<template>
  <v-app id="inspire">
    <v-navigation-drawer
      v-model="drawer"
      :clipped="$vuetify.breakpoint.lgAndUp"
      app
    >
      <v-list>
        <v-list-item-group v-model="item" color="primary">
          <template v-for="item in items">
            <v-row v-if="item.heading" :key="item.heading" align="center">
              <v-col cols="6">
                <v-subheader v-if="item.heading">
                  {{ item.heading }}
                </v-subheader>
              </v-col>
              <v-col cols="6" class="text-center">
                <a href="#!" class="body-2 black--text">EDIT</a>
              </v-col>
            </v-row>
            <!--
          <v-list-group
            v-else-if="item.children"
            :key="item.text"
            v-model="item.model"
            :prepend-icon="item.model ? item.icon : item['icon-alt']"
            append-icon=""
          >
            <template v-slot:activator>
              <v-list-item-content>
                <v-list-item-title>
                  {{ item.text }}
                </v-list-item-title>
              </v-list-item-content>
            </template>
            <v-list-item v-for="(child, i) in item.children" :key="i" link>
              <v-list-item-action v-if="child.icon">
                <v-icon>{{ child.icon }}</v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>
                  {{ child.text }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-group>
          -->
            <v-list-item v-else :key="item.text" link>
              <!--<v-list-item-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-action>-->
              <v-list-item-content>
                <v-list-item-title>
                  {{ item.text }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-system-bar class="pr-0" id="titlebar" color="blue darken-3" app window>
      <span class="drag-region" style="color:white; width:100%; padding-top:5px"
        >Movselexx</span
      >
      <v-spacer></v-spacer>
      <v-btn class="windowcontrol pl-2" icon tile @click="minimizeWindow()"
        ><v-icon small style="color:white;text-align:center"
          >mdi-minus</v-icon
        ></v-btn
      >
      <v-btn class="windowcontrol pl-2" icon tile @click="maximizeWindow()"
        ><v-icon small style="color:white"
          >mdi-checkbox-blank-outline</v-icon
        ></v-btn
      >
      <v-btn class="windowcontrol pl-2" icon tile
        ><v-icon small style="color:white" @click="closeWindow()"
          >mdi-close</v-icon
        ></v-btn
      >
    </v-system-bar>
    <v-app-bar :clipped-left="$vuetify.breakpoint.lgAndUp" app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title style="width: 300px" class="ml-0 pl-4">
        <span class="hidden-sm-and-down">XXXXXXXXXXXXXXXXXX</span>
      </v-toolbar-title>
      <!--<v-text-field
        flat
        solo-inverted
        hide-details
        prepend-inner-icon="mdi-magnify"
        label="Search"
        class="hidden-sm-and-down"
      ></v-text-field>-->
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </v-app-bar>
    <v-main>
      <router-view></router-view>
    </v-main>
    <v-footer app>
      <v-row>
        <v-col class="pa-0 px-1">
          <v-btn color="primary" block>Throw</v-btn>
        </v-col>
        <v-col class="pa-0 px-1">
          <v-btn color="primary" block>Shuffle</v-btn>
        </v-col>
        <v-col cols="1" class="pa-0 px-1">
          <v-btn color="primary" block>Prev</v-btn>
        </v-col>
        <v-col cols="1" class="pa-0 px-1">
          <v-btn color="primary" block>Next</v-btn>
        </v-col>
      </v-row>
      <v-progress-linear
        class="d-none my-3"
        indeterminate
        color="yellow darken-2"
      ></v-progress-linear>
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
  </v-app>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import electron from "electron";

@Component
export default class App extends Vue {
  private ipcRenderer = electron.ipcRenderer;
  dialog = false;
  drawer = null;
  item = null;
  items = [
    { text: "ALL MOVIE" },
    { text: "再生中" },
    { text: "未再生" },
    { text: "再生履歴" },
    { text: "1週間以内に追加した" },
    { text: "再生頻度が高いもの" },
    { text: "映画っぽいもの" },
    { text: "存在しないもの" },
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
  /**
   * コンストラクタ
   */
  constructor() {
    super();
  }

  async created() {
    //
  }

  mounted() {
    //
    //this.$vuetify.theme.dark = true;
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

  test() {
    //
    console.log("test");
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
  box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
    0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12);
}
</style>
