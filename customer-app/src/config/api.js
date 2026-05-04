import Constants from 'expo-constants';
import { Platform } from 'react-native';

// function extractHost(value) {
//   if (!value) return null;
//   const withoutProtocol = String(value).replace(/^https?:\/\//, '');
//   return withoutProtocol.split('/')[0]?.split(':')[0] || null;
// }

// function normalizeHostForDevice(host) {
//   if (!host) return null;
//   if ((host === 'localhost' || host === '127.0.0.1') && Platform.OS === 'android') {
//     // Android emulator uses 10.0.2.2 to reach host machine localhost.
//     return '10.0.2.2';
//   }
//   return host;
// }

// function getExpoHost() {
//   const hostSource =
//     Constants.expoConfig?.hostUri ||
//     Constants.manifest2?.extra?.expoGo?.debuggerHost ||
//     Constants.manifest?.debuggerHost ||
//     NativeModules?.SourceCode?.scriptURL ||
//     '';

//   return normalizeHostForDevice(extractHost(hostSource));
// }

// const detectedHost = getExpoHost();
// const fallbackLocalApi = 'http://127.0.0.1:5001/api';

// // Prefer explicit env override if defined; otherwise derive from current Expo host.
// export const API_BASE_URL =
//   process.env.EXPO_PUBLIC_API_BASE_URL ||
//   (detectedHost ? `http://${detectedHost}:5001/api` : fallbackLocalApi);

// export const api = {
//   getMenu: `${API_BASE_URL}/menu`,
//   getSettings: `${API_BASE_URL}/settings`,
//   getOrders: `${API_BASE_URL}/orders`,
//   createOrder: `${API_BASE_URL}/orders`,
//   createPayment: `${API_BASE_URL}/payment/create-order`,
//   verifyPayment: `${API_BASE_URL}/payment/verify`,
// };


// import Constants from 'expo-constants';
// import { Platform } from 'react-native';

// // 🔧 Your PC IP address (important)
// const LOCAL_IP = "192.168.0.7";

// // Detect Expo host (for Expo Go / development)
// function getExpoHost() {
//   const hostUri =
//     Constants.expoConfig?.hostUri ||
//     Constants.manifest2?.extra?.expoGo?.debuggerHost ||
//     Constants.manifest?.debuggerHost;

//   if (!hostUri) return null;

//   const host = hostUri.split(':')[0];
//   return host;
// }

// // Decide correct API URL
// function getBaseURL() {
//   const expoHost = getExpoHost();

//   // Expo Go
//   if (expoHost) {
//     return `http://${expoHost}:5001/api`;
//   }

//   // Android Emulator
//   if (Platform.OS === "android") {
//     return `http://${LOCAL_IP}:5001/api`;
//   }

//   // Real Device / APK
//   return `http://${LOCAL_IP}:5001/api`;
// }

// export const API_BASE_URL =
//   process.env.EXPO_PUBLIC_API_BASE_URL ||
//   getBaseURL();

// export const api = {
//   getMenu: `${API_BASE_URL}/menu`,
//   getSettings: `${API_BASE_URL}/settings`,
//   getOrders: `${API_BASE_URL}/orders`,
//   createOrder: `${API_BASE_URL}/orders`,
//   createPayment: `${API_BASE_URL}/payment/create-order`,
//   verifyPayment: `${API_BASE_URL}/payment/verify`,
// };
// import { Platform } from "react-native";

// // Your PC IP
// const LOCAL_IP = "192.168.0.7";

// export const API_BASE_URL =
//   process.env.EXPO_PUBLIC_API_BASE_URL ||
//   `http://${LOCAL_IP}:5001/api`;

// export const api = {
//   getMenu: `${API_BASE_URL}/menu`,
//   getSettings: `${API_BASE_URL}/settings`,
//   getOrders: `${API_BASE_URL}/orders`,
//   createOrder: `${API_BASE_URL}/orders`,
//   createPayment: `${API_BASE_URL}/payment/create-order`,
//   verifyPayment: `${API_BASE_URL}/payment/verify`,
// };

function stripTrailingSlash(url) {
  return String(url).replace(/\/+$/, '');
}

function hostFromDebuggerUri(value) {
  if (!value) return null;
  const withoutProtocol = String(value).replace(/^https?:\/\//, '');
  return withoutProtocol.split('/')[0]?.split(':')[0] || null;
}

function normalizeHostForDevice(host) {
  if (!host) return null;
  if ((host === 'localhost' || host === '127.0.0.1') && Platform.OS === 'android') {
    return '10.0.2.2';
  }
  return host;
}

function expoDevHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;
  if (!hostUri) return null;
  return normalizeHostForDevice(hostFromDebuggerUri(hostUri));
}

function resolveApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv) {
    return stripTrailingSlash(fromEnv);
  }
  if (__DEV__) {
    const host = expoDevHost();
    if (host) {
      return `http://${host}:5002/api`;
    }
    return Platform.OS === 'android' ? 'http://10.0.2.2:5002/api' : 'http://127.0.0.1:5002/api';
  }
  throw new Error(
    'Release build: set EXPO_PUBLIC_API_BASE_URL to your deployed API (e.g. https://your-api.onrender.com/api).',
  );
}

export const API_BASE_URL = resolveApiBaseUrl();

export const api = {
  getMenu: `${API_BASE_URL}/menu`,
  getSettings: `${API_BASE_URL}/settings`,
  getOrders: `${API_BASE_URL}/orders`,
  createOrder: `${API_BASE_URL}/orders`,
  createPayment: `${API_BASE_URL}/payment/create-order`,
  verifyPayment: `${API_BASE_URL}/payment/verify`,
};