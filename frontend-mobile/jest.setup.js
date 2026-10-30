process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "test-web-client";
process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = "test-android-client";
process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = "test-ios-client";

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
