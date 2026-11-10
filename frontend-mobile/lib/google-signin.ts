import { Platform } from "react-native";

import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "./auth";

let configured = false;

export async function requestGoogleIdToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const {
    GoogleOneTapSignIn,
    isNoSavedCredentialFoundResponse,
    isSuccessResponse,
  } = await import("react-native-nitro-google-signin");

  if (!configured) {
    GoogleOneTapSignIn.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
      offlineAccess: false,
    });
    configured = true;
  }

  if (Platform.OS === "android") {
    await GoogleOneTapSignIn.checkPlayServices();
  }

  let response = await GoogleOneTapSignIn.signIn();
  if (isNoSavedCredentialFoundResponse(response)) {
    response = await GoogleOneTapSignIn.createAccount();
  }
  if (isNoSavedCredentialFoundResponse(response)) {
    response = await GoogleOneTapSignIn.presentExplicitSignIn();
  }

  if (!isSuccessResponse(response)) return null;

  return response.data.idToken ?? null;
}