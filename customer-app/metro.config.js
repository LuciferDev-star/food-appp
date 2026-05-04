const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname);

function debugLog(hypothesisId, message, data, location) {
  // #region agent log
  fetch('http://127.0.0.1:7632/ingest/c4ec2c2e-77a2-4c8b-9880-bafeebd4689d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'ad9d1c' },
    body: JSON.stringify({
      sessionId: 'ad9d1c',
      runId: 'initial-metro',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

const rnPackagePath = path.join(__dirname, 'node_modules', 'react-native', 'package.json');
const expoPackagePath = path.join(__dirname, 'node_modules', 'expo', 'package.json');
const appJsonPath = path.join(__dirname, 'app.json');
const metroPackagePath = path.join(__dirname, 'node_modules', 'metro', 'package.json');
const metroCorePackagePath = path.join(__dirname, 'node_modules', 'metro-core', 'package.json');
const rnDevLoadingViewPath = path.join(
  __dirname,
  'node_modules',
  'react-native',
  'Libraries',
  'Utilities',
  'DevLoadingView.js'
);

let rnVersion = 'unknown';
try {
  rnVersion = JSON.parse(fs.readFileSync(rnPackagePath, 'utf8')).version || 'unknown';
} catch {}

let installedExpoVersion = 'unknown';
let appJsonSdkVersion = 'unknown';
let metroVersion = 'unknown';
let metroCoreVersion = 'unknown';
try {
  installedExpoVersion = JSON.parse(fs.readFileSync(expoPackagePath, 'utf8')).version || 'unknown';
} catch {}
try {
  appJsonSdkVersion = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'))?.expo?.sdkVersion || 'unknown';
} catch {}
try {
  metroVersion = JSON.parse(fs.readFileSync(metroPackagePath, 'utf8')).version || 'unknown';
} catch {}
try {
  metroCoreVersion = JSON.parse(fs.readFileSync(metroCorePackagePath, 'utf8')).version || 'unknown';
} catch {}

debugLog(
  'H5',
  'Metro config loaded with package/file checks',
  {
    rnVersion,
    expoVersion: require('./package.json').dependencies?.expo || 'unknown',
    installedExpoVersion,
    appJsonSdkVersion,
    metroVersion,
    metroCoreVersion,
    hasRnDevLoadingViewFile: fs.existsSync(rnDevLoadingViewPath),
    rnDevLoadingViewPath,
  },
  'customer-app/metro.config.js:init'
);

debugLog(
  'H7',
  'SDK and runtime compatibility snapshot',
  {
    appJsonSdkVersion,
    installedExpoVersion,
    rnVersion,
    metroVersion,
    metroCoreVersion,
    mismatchDetected: appJsonSdkVersion !== 'unknown' && !appJsonSdkVersion.startsWith(installedExpoVersion.split('.')[0]),
  },
  'customer-app/metro.config.js:compatibilitySnapshot'
);

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react-native/Libraries/Utilities/DevLoadingView' ||
    moduleName === 'react-native/package.json'
  ) {
    debugLog(
      'H6',
      'Metro resolving target module',
      {
        moduleName,
        platform: platform || 'unknown',
        originModulePath: context?.originModulePath || 'unknown',
      },
      'customer-app/metro.config.js:resolveRequest:before'
    );
  }

  const resolver = originalResolveRequest ?? context.resolveRequest;
  const result = resolver(context, moduleName, platform);

  if (moduleName === 'react-native/Libraries/Utilities/DevLoadingView') {
    debugLog(
      'H6',
      'Metro resolved DevLoadingView module',
      { resultType: typeof result, filePath: result?.filePath || 'unknown' },
      'customer-app/metro.config.js:resolveRequest:after'
    );
  }

  return result;
};

module.exports = config;
