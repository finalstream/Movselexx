<template>
  <div class="home">
    <v-container>
      <v-row>
        <v-col cols="4">
          <v-btn-toggle color="blue accent-3">
            <v-btn value="normal">
              <span class="hidden-sm-and-down">Normal</span>
            </v-btn>
            <v-btn value="favorite">
              <span class="hidden-sm-and-down">Favorite</span>
            </v-btn>
            <v-btn value="exclude">
              <span class="hidden-sm-and-down">Exclude</span>
            </v-btn>
          </v-btn-toggle>
        </v-col>
        <v-col
          ><v-text-field
            flat
            solo-inverted
            hide-details
            prepend-inner-icon="mdi-magnify"
            label="Search"
          ></v-text-field
        ></v-col>
        <v-col cols="1" class="text-right">
          <div class="pt-3">{{ items.length }} items</div>
        </v-col>
      </v-row>
      <v-data-table
        :headers="headers"
        :items="items"
        class="elevation-1"
        hide-default-footer
        @dblclick:row="rowDbClick"
      >
        <template v-slot:item.isPlaying="{ item }">
          <v-icon v-show="item.isPlaying">mdi-play-circle-outline</v-icon>
        </template>
        <template v-slot:item.isFavorite="{ item }">
          <v-icon v-show="item.isFavorite">mdi-star</v-icon>
        </template>
        <template v-slot:item.isPlayed="{ item }">
          <v-icon v-show="item.isPlayed">mdi-check-outline</v-icon>
        </template>
      </v-data-table>
    </v-container>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class Home extends Vue {
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
  items = [
    {
      isPlaying: true,
      groupId: "1",
      groupName: "プリンセスコネクト！Re:Dive",
      title: "プリンセスコネクト！Re:Dive 01",
      no: 1,
      length: "24:00",
      isFavorite: true,
      isPlayed: true,
      date: "2020-09-05",
      videoSize: "1280x720",
      drive: "E",
      playCount: 21,
    },
  ];

  /**
   * コンストラクタ
   */
  constructor() {
    super();
  }

  async created() {
    //const res = await this.ipcRenderer.invoke("getStore", "searchDirectory");
    //if (res) this.mainData.searchDirectory = res;
  }

  mounted() {
    //this.ipcRenderer.invoke("ready");
  }

  rowDbClick(e: any, value: any) {
    console.log(value);
  }
}
</script>
