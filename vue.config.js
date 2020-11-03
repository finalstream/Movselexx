module.exports = {
  node: {
    __dirname: false,
    __filename: false,
  },
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
            from: "bin",
            to: "bin",
            filter: ["**/*"],
          },
        ],
      },
    },
  },
};
