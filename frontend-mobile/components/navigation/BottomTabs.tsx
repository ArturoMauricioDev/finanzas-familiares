import { Tabs } from "expo-router";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";
import { tabItems } from "../../lib/navigation";
import { touchTarget } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export function BottomTabs() {
  const { t } = useI18n();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.onSecondaryContainer,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarActiveBackgroundColor: colors.secondaryContainer,
        tabBarStyle: {
          minHeight: touchTarget.min + 16,
          backgroundColor: colors.surfaceContainer,
          borderTopColor: colors.outlineVariant,
          paddingVertical: 4,
        },
        tabBarLabelStyle: typeStyle("labelMedium"),
      }}
    >
      {tabItems.map((item) => {
        const Icon = item.icon;
        return (
          <Tabs.Screen
            key={item.name}
            name={item.name}
            options={{
              title: t(item.labelKey),
              tabBarAccessibilityLabel: t(item.labelKey),
              tabBarIcon: ({ color, size }) => <Icon color={color} size={size} />,
            }}
          />
        );
      })}
    </Tabs>
  );
}
