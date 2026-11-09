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
    <div className="w-full max-w-[320px]">
      <GoogleLogin
        onSuccess={(response) => onSuccess(response.credential ?? "")}
        onError={onError}
        useOneTap={false}
        shape="pill"
        size="large"
        text="continue_with"
        theme="outline"
      />
    </div>
  );
}