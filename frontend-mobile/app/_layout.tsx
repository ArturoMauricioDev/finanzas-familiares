import "react-native-gesture-handler";

import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { AppProviders } from "../components/providers/AppProviders";
import { useTheme } from "../components/providers/ThemeProvider";

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const [fontsLoaded] = useFonts({
    Inter: Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const { resolved } = useTheme();

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
