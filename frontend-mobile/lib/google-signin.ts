import { Platform } from "react-native";
import type { OneTapResponse } from "react-native-nitro-google-signin";

import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "./auth";

export type GoogleSignInResult =
  | { status: "success"; idToken: string }
  | { status: "cancelled" }
  | { status: "error"; code?: string; message?: string };

type NativeError = {
  code?: string;
  message?: string;
};

let configured = false;

function loadModule() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("react-native-nitro-google-signin") as typeof import("react-native-nitro-google-signin");
}

type GoogleSignInModule = ReturnType<typeof loadModule>;
async function ensureConfigured(module: GoogleSignInModule) {
  if (configured) return;

  module.GoogleOneTapSignIn.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    offlineAccess: false,
  });

  if (Platform.OS === "android") {
    await module.GoogleOneTapSignIn.checkPlayServices();
  }

  configured = true;
}

function successResult(response: OneTapResponse): GoogleSignInResult {
  const idToken = response.data?.idToken;
  if (!idToken) return { status: "error", code: "MISSING_ID_TOKEN" };
  return { status: "success", idToken };
}

function responseToResult(
  module: GoogleSignInModule,
  response: OneTapResponse,
): GoogleSignInResult {
  if (module.isCancelledResponse(response)) return { status: "cancelled" };
  if (module.isSuccessResponse(response)) return successResult(response);
  return {
    status: "error",
    message: `Unexpected Google Sign-In response: ${response.type ?? "unknown"}`,
  };
}

export async function requestGoogleIdToken(): Promise<GoogleSignInResult> {
  if (Platform.OS === "web") {
    return {
      status: "error",
      code: "UNSUPPORTED_PLATFORM",
      message: "Google One Tap is only available on native platforms.",
    };
  }

  let module: GoogleSignInModule | undefined;

  try {
    module = loadModule();
    await ensureConfigured(module);

    const google = module.GoogleOneTapSignIn;
    let response = (await google.signIn()) as OneTapResponse;

    if (module.isSuccessResponse(response)) return successResult(response);
    if (module.isCancelledResponse(response)) return { status: "cancelled" };

    if (module.isNoSavedCredentialFoundResponse(response)) {
      response = (await google.createAccount()) as OneTapResponse;
      if (module.isSuccessResponse(response)) return successResult(response);
      if (module.isCancelledResponse(response)) return { status: "cancelled" };

      if (module.isNoSavedCredentialFoundResponse(response)) {
        response = (await google.presentExplicitSignIn()) as OneTapResponse;
        return responseToResult(module, response);
      }
    }

    return responseToResult(module, response);
  } catch (error) {
    const nativeError = error as NativeError;

    if (module?.isErrorWithCode(error)) {
      if (nativeError.code === "SIGN_IN_CANCELLED") return { status: "cancelled" };
      return {
        status: "error",
        code: nativeError.code,
        message: nativeError.message,
      };
    }

    return {
      status: "error",
      message: error instanceof Error ? error.message : undefined,
    };
  }
}
