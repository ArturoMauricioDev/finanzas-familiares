import { Image, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";
import { createDefaultAvatar } from "../../lib/avatar-engine.generated";

const sizes = { sm: 32, md: 40, lg: 56, xl: 96 } as const;

function svgFromDataUri(value: string): string | null {
  if (!value.startsWith("data:image/svg+xml,")) return null;
  try {
    return decodeURIComponent(value.slice("data:image/svg+xml,".length));
  } catch {
    return null;
  }
}

export function Avatar({
  name,
  src,
  seed,
  size = "md",
}: {
  name?: string | null;
  src?: string | null;
  seed?: string | null;
  size?: keyof typeof sizes;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const pixels = sizes[size];
  const source = src || createDefaultAvatar(seed || name || "kitho");
  const svg = svgFromDataUri(source);
  const label = name ? `${t("a11y.avatar")} ${name}` : t("a11y.avatar");

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        width: pixels,
        height: pixels,
        borderRadius: pixels / 2,
        overflow: "hidden",
        backgroundColor: colors.surfaceContainerHighest,
      }}
    >
      {svg ? (
        <SvgXml xml={svg} width={pixels} height={pixels} />
      ) : (
        <Image source={{ uri: source }} style={{ width: pixels, height: pixels }} />
      )}
    </View>
  );
}
