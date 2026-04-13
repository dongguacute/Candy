import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { AppProvider } from "../src/context/AppContext";

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

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
