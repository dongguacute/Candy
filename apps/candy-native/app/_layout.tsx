import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useAppContext } from "../src/context/AppContext";
import { dark, light } from "../src/theme";

function setupGlobalErrorNormalizer() {
  const maybeErrorUtils = (globalThis as unknown as {
    ErrorUtils?: {
      getGlobalHandler?: () => (error: unknown, isFatal?: boolean) => void;
      setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
      __candyPatched?: boolean;
    };
  }).ErrorUtils;
  if (!maybeErrorUtils || maybeErrorUtils.__candyPatched) return;
  const defaultHandler = maybeErrorUtils.getGlobalHandler?.();
  maybeErrorUtils.setGlobalHandler?.((error: unknown, isFatal?: boolean) => {
    if (error instanceof Error) {
      defaultHandler?.(error, isFatal);
      return;
    }
    const safeMessage =
      typeof error === "string"
        ? error
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return String(error);
            }
          })();
    defaultHandler?.(new Error(safeMessage), isFatal);
  });
  maybeErrorUtils.__candyPatched = true;
}

setupGlobalErrorNormalizer();

function RootNavigator() {
  const { resolvedTheme } = useAppContext();
  const c = resolvedTheme === "dark" ? dark : light;

  return (
    <>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} backgroundColor={c.bg} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}
