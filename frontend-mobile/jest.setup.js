process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-web-client";
process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = "test-android-client";
process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = "test-ios-client";

jest.mock("expo-system-ui", () => ({
  setBackgroundColorAsync: jest.fn(async () => {}),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    SafeAreaConsumer: ({ children }) => children(insets),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    initialWindowMetrics: { insets, frame: { x: 0, y: 0, width: 390, height: 844 } },
  };
});

jest.mock("lucide-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Icon = (props) => React.createElement(View, props);
  return new Proxy(
    {},
    {
      get: (_target, property) => (property === "__esModule" ? true : Icon),
    },
  );
});

jest.mock("expo-secure-store", () => {
  const store = new Map();

  return {
    getItemAsync: jest.fn(async (key) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
    __clear: () => store.clear(),
  };
});
