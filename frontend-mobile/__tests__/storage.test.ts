import * as SecureStore from "expo-secure-store";

import * as storage from "../lib/storage";

const nativeStore = SecureStore as unknown as { __clear: () => void };

async function withBrowserStorage(
  platformOS: "web" | "ios",
  run: (
    webStorage: typeof import("../lib/storage"),
    values: Map<string, string>,
  ) => Promise<void>,
) {
  const values = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

  Object.defineProperty(globalThis, "window", {
    value: { localStorage },
    configurable: true,
  });

  try {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("react-native", () => ({ Platform: { OS: platformOS } }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const webStorage = require("../lib/storage") as typeof import("../lib/storage");
      await run(webStorage, values);
    });
  } finally {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
}

beforeEach(() => {
  nativeStore.__clear();
  jest.clearAllMocks();
});

describe("storage on native", () => {
  it("delegates to SecureStore", async () => {
    await storage.setItemAsync("key", "value");

    expect(await storage.getItemAsync("key")).toBe("value");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("key", "value");

    await storage.deleteItemAsync("key");

    expect(await storage.getItemAsync("key")).toBeNull();
  });
});

describe("storage on web", () => {
  it("uses localStorage when Platform.OS is web", async () => {
    await withBrowserStorage("web", async (webStorage, values) => {
      await webStorage.setItemAsync("key", "value");
      expect(values.get("key")).toBe("value");
      expect(await webStorage.getItemAsync("key")).toBe("value");

      await webStorage.deleteItemAsync("key");
      expect(await webStorage.getItemAsync("key")).toBeNull();
    });
  });

  it("uses localStorage when a browser storage exists but Platform.OS is not web", async () => {
    await withBrowserStorage("ios", async (webStorage, values) => {
      await webStorage.setItemAsync("key", "value");
      expect(values.get("key")).toBe("value");
      expect(await webStorage.getItemAsync("key")).toBe("value");
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });
  });
});