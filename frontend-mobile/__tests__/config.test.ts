import { ConfigurationError, getApiBaseUrl } from "../lib/api";

jest.mock("../lib/env", () => ({ API_URL: undefined }));

describe("mobile api configuration", () => {
  it("requires EXPO_PUBLIC_API_URL", () => {
    expect(() => getApiBaseUrl()).toThrow(ConfigurationError);
    expect(() => getApiBaseUrl()).toThrow("errors.details.missingMobileApiUrl");
  });
});
