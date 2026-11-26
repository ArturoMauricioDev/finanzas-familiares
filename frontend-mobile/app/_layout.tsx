import "react-native-gesture-handler";

import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { AppProviders } from "../components/providers/AppProviders";
import { useTheme } from "../components/providers/ThemeProvider";
import { capturePendingInviteFromUrl } from "../lib/session";

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const [fontsLoaded] = useFonts({
    Inter: Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const { resolved, hydrated } = useTheme();

  useEffect(() => {
    if (fontsLoaded && hydrated) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <>
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void Linking.getInitialURL().then((url) => capturePendingInviteFromUrl(url));
    const subscription = Linking.addEventListener("url", ({ url }) => {
      void capturePendingInviteFromUrl(url);
    });
    return () => subscription.remove();
  }, []);

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
