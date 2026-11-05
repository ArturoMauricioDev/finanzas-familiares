import { readFileSync } from "node:fs";
import path from "node:path";

import { tabItems } from "../lib/navigation";

describe("mobile navigation", () => {
  it("defines three bottom tabs without settings", () => {
    expect(tabItems.map((item) => item.href)).toEqual(["/", "/family/members", "/profile"]);
    expect(tabItems.some((item) => item.href === "/settings")).toBe(false);
    expect(tabItems.map((item) => item.labelKey)).toEqual([
      "nav.home",
      "nav.members",
      "nav.profile",
    ]);
  });

  it("wires the tab layout to the shared configuration", () => {
    const layout = readFileSync(
      path.resolve(__dirname, "..", "app", "(app)", "(tabs)", "_layout.tsx"),
      "utf8",
    );

    expect(layout).toContain("BottomTabs");
    expect(layout).not.toContain("settings");
  });

  it("keeps settings reachable from the profile screen instead of a tab", () => {
    const profile = readFileSync(
      path.resolve(__dirname, "..", "app", "(app)", "(tabs)", "profile.tsx"),
      "utf8",
    );

    expect(profile).toContain('router.push("/settings")');
  });
});