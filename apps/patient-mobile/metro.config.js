const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// patient-mobile isn't an npm workspace member (Metro's monorepo assumptions don't play well
// with React Native's native-module resolution), but it still imports source files directly
// from ../../shared. Metro only watches/resolves within projectRoot by default, so both need
// to be widened explicitly — this is Expo's documented monorepo pattern.
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
