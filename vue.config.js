module.exports = {
  // debug
  configureWebpack: {
    devtool: "source-map",
  },
  transpileDependencies: ["vuetify"],
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: "net.finalstream.movselexx",
        productName: "Movselexx",
        win: {
          icon: "./src/assets/icon.png",
        },
        files: ["**/*"],
        extraFiles: [
          {
            from: "database",
            to: "database",
            filter: ["**/*"],
          },
          {
            from: "filter.json",
            to: "filter.json",
            filter: ["**/*"],
          },
          {
            from: "bin",
            to: "bin",
            filter: ["**/*"],
          },
        ],
      },
    },
  },
};
