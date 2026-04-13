import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppContext } from "../../src/context/AppContext";
import { dark, light } from "../../src/theme";

export default function TabLayout() {
  const { t, resolvedTheme } = useAppContext();
  const c = resolvedTheme === "dark" ? dark : light;

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: c.surface,
        },
        headerTintColor: c.text,
        headerTitleStyle: {
          color: c.text,
        },
        headerShadowVisible: resolvedTheme !== "dark",
        sceneStyle: {
          backgroundColor: c.bg,
        },
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
        },
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
