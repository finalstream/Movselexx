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
        files: ["**/*"],
        extraFiles: [
          {
            from: "database",
            to: "database",
            filter: ["**/*"],
          },
        ],
      },
    },
  },
};
