/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
    ignoredRouteFiles: ["**/.*"],
    appDirectory: "src",
    assetsBuildDirectory: "build/assets",
    publicPath: "/assets/",
    serverBuildPath: "build/index.js",
    serverModuleFormat: "cjs",
    serverPlatform: "node",
    serverRuntime: "node",
};