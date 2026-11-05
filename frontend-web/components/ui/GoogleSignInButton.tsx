"use client";

import { GoogleLogin } from "@react-oauth/google";

export function GoogleSignInButton({
  onSuccess,
  onError,
}: {
  onSuccess: (credential: string) => void;
  onError: () => void;
}) {
  return (
    <GoogleLogin
      onSuccess={(response) => onSuccess(response.credential ?? "")}
      onError={onError}
      useOneTap={false}
      width="320"
    />
  );
}
