import { GoogleOneTapSignIn } from "react-native-nitro-google-signin";

import { requestGoogleIdToken } from "../lib/google-signin";

const google = GoogleOneTapSignIn as unknown as {
  checkPlayServices: jest.Mock;
  signIn: jest.Mock;
  createAccount: jest.Mock;
  presentExplicitSignIn: jest.Mock;
};

const cancelled = { type: "cancelled", data: null };
const noSavedCredential = { type: "noSavedCredentialFound", data: null };

beforeEach(() => {
  jest.clearAllMocks();
  google.checkPlayServices.mockResolvedValue(undefined);
  google.signIn.mockResolvedValue(noSavedCredential);
  google.createAccount.mockResolvedValue(cancelled);
  google.presentExplicitSignIn.mockResolvedValue(cancelled);
});

describe("requestGoogleIdToken", () => {
  it("returns the id token on success", async () => {
    google.signIn.mockResolvedValue({
      type: "success",
      data: { idToken: "id-token" },
    });

    await expect(requestGoogleIdToken()).resolves.toEqual({
      status: "success",
      idToken: "id-token",
    });
  });

  it("returns cancelled when the native sheet is dismissed", async () => {
    google.signIn.mockResolvedValue(cancelled);

    await expect(requestGoogleIdToken()).resolves.toEqual({ status: "cancelled" });
  });

  it("falls back to account creation and explicit sign-in", async () => {
    google.signIn.mockResolvedValue(noSavedCredential);
    google.createAccount.mockResolvedValue(noSavedCredential);
    google.presentExplicitSignIn.mockResolvedValue({
      type: "success",
      data: { idToken: "explicit-token" },
    });

    await expect(requestGoogleIdToken()).resolves.toEqual({
      status: "success",
      idToken: "explicit-token",
    });
    expect(google.createAccount).toHaveBeenCalledTimes(1);
    expect(google.presentExplicitSignIn).toHaveBeenCalledTimes(1);
  });

  it("returns cancelled when every native step is dismissed", async () => {
    google.signIn.mockResolvedValue(noSavedCredential);
    google.createAccount.mockResolvedValue(noSavedCredential);
    google.presentExplicitSignIn.mockResolvedValue(cancelled);

    await expect(requestGoogleIdToken()).resolves.toEqual({ status: "cancelled" });
  });

  it("maps Play Services failures to an error code", async () => {
    google.signIn.mockRejectedValue(
      Object.assign(new Error("Play services missing"), {
        code: "PLAY_SERVICES_NOT_AVAILABLE",
      }),
    );

    await expect(requestGoogleIdToken()).resolves.toEqual({
      status: "error",
      code: "PLAY_SERVICES_NOT_AVAILABLE",
      message: "Play services missing",
    });
  });

  it("maps a thrown native cancellation to cancelled", async () => {
    google.signIn.mockRejectedValue(
      Object.assign(new Error("cancelled"), { code: "SIGN_IN_CANCELLED" }),
    );

    await expect(requestGoogleIdToken()).resolves.toEqual({ status: "cancelled" });
  });

  it("returns an error when the success response has no id token", async () => {
    google.signIn.mockResolvedValue({ type: "success", data: { idToken: null } });

    await expect(requestGoogleIdToken()).resolves.toEqual({
      status: "error",
      code: "MISSING_ID_TOKEN",
    });
  });

  it("returns an error for unexpected native failures", async () => {
    google.signIn.mockRejectedValue(new Error("boom"));

    await expect(requestGoogleIdToken()).resolves.toEqual({
      status: "error",
      message: "boom",
    });
  });
});
