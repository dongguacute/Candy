import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppContext } from "../../src/context/AppContext";
import { dark, light } from "../../src/theme";

export default function TabLayout() {
  const { t, resolvedTheme } = useAppContext();
  const c = resolvedTheme === "dark" ? dark : light;
  const androidTopBg = c.surface;
  const androidTopBorderWidth = Platform.OS === "android" ? 0 : StyleSheet.hairlineWidth;
  const tabBarHeight = Platform.OS === "android" ? 58 : 62;
  const tabBarPaddingTop = Platform.OS === "android" ? 4 : 6;
  const tabBarPaddingBottom = Platform.OS === "android" ? 4 : 8;

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: androidTopBg,
          borderBottomColor: c.border,
          borderBottomWidth: androidTopBorderWidth,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: c.text,
        headerTitleStyle: {
          color: c.text,
          fontWeight: "700",
        },
        headerShadowVisible: false,
        sceneStyle: {
          backgroundColor: c.bg,
        },
        tabBarStyle: {
          backgroundColor: androidTopBg,
          borderTopColor: c.border,
          borderTopWidth: androidTopBorderWidth,
          elevation: 0,
          shadowOpacity: 0,
          height: tabBarHeight,
          paddingTop: tabBarPaddingTop,
          paddingBottom: tabBarPaddingBottom,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarItemStyle: { borderRadius: 12 },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: c.accentDark,
        tabBarInactiveTintColor: c.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: String(t("Home.title")),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="medication" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pending"
        options={{
          title: String(t("Pending.title")),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="pending-actions" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: String(t("Settings.title")),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
