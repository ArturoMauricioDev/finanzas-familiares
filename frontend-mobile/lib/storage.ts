import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

function webStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    return storage && typeof storage.getItem === "function" ? storage : null;
  } catch {
    return null;
  }
}

function hasWebStorage(): boolean {
  if (Platform.OS === "web") return true;
  return webStorage() !== null;
}

export async function getItemAsync(key: string): Promise<string | null> {
  if (hasWebStorage()) {
    return webStorage()?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (hasWebStorage()) {
    webStorage()?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (hasWebStorage()) {
    webStorage()?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}