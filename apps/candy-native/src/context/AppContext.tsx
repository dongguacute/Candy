import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import * as Notifications from "expo-notifications";
import { copy } from "@candy/copy";
import {
  dosageKeyForI18n,
  PENDING_INTAKE_TTL_MS,
  type Language,
  type Medication,
  type PendingIntakeItem,
  type Theme,
  type TimeToTake,
} from "@candy/shared";
import cnMessages from "@candy/shared/messages/cn.json";
import enMessages from "@candy/shared/messages/en.json";

export type { Language, Medication, PendingIntakeItem, Theme, TimeToTake };
export { PENDING_INTAKE_TTL_MS };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const messagesMap = { cn: cnMessages, en: enMessages };

const TIME_SLOTS: TimeToTake[] = ["breakfast", "lunch", "dinner", "bedtime"];

/** 防止 AsyncStorage 中旧/损坏数据导致字段非字符串，进而在 <Text> 等处渲染崩溃 */
function normalizeMedication(raw: unknown): Medication | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? "").trim();
  let name: string;
  if (typeof o.name === "string") name = o.name.trim();
  else name = String(o.name ?? "").trim();
  if (!id || !name) return null;

  const timesRaw = o.times;
  const times: TimeToTake[] = Array.isArray(timesRaw)
    ? timesRaw.filter(
        (t): t is TimeToTake =>
          typeof t === "string" && (TIME_SLOTS as readonly string[]).includes(t)
      )
    : [];

  let iconType: "emoji" | "image" = "emoji";
  if (o.iconType === "image") iconType = "image";

  let iconValue: string;
  if (typeof o.iconValue === "string") iconValue = o.iconValue;
  else iconValue = String(o.iconValue ?? "💊");

  let dosage: string | undefined;
  if (o.dosage === undefined || o.dosage === null) dosage = undefined;
  else if (typeof o.dosage === "string") dosage = o.dosage;
  else dosage = String(o.dosage);

  let reminderCopy: string | undefined;
  if (typeof o.reminderCopy === "string") {
    const trimmed = o.reminderCopy.trim();
    reminderCopy = trimmed || undefined;
  }

  return { id, name, times, iconType, iconValue, dosage, reminderCopy };
}

function normalizeMedications(raw: unknown): Medication[] {
  if (!Array.isArray(raw)) return [];
  const out: Medication[] = [];
  for (const item of raw) {
    const m = normalizeMedication(item);
    if (m) out.push(m);
  }
  return out;
}

function medicationDataEqual(
  a: Omit<Medication, "id">,
  b: Omit<Medication, "id">
): boolean {
  if (a.name.trim() !== b.name.trim()) return false;
  if (a.iconType !== b.iconType || a.iconValue !== b.iconValue) return false;
  if ((a.dosage ?? "1") !== (b.dosage ?? "1")) return false;
  if ((a.reminderCopy ?? "").trim() !== (b.reminderCopy ?? "").trim()) return false;
  const ta = [...a.times].sort().join("\0");
  const tb = [...b.times].sort().join("\0");
  return ta === tb;
}

function toMedicationData(m: Medication): Omit<Medication, "id"> {
  return {
    name: m.name,
    times: m.times,
    dosage: m.dosage,
    iconType: m.iconType,
    iconValue: m.iconValue,
    reminderCopy: m.reminderCopy,
  };
}

function isValidLanguage(value: string | null): value is Language {
  return value === "cn" || value === "en";
}

function detectDeviceLanguage(): Language {
  const code = Localization.getLocales()[0]?.languageCode ?? "en";
  return code.toLowerCase().startsWith("zh") ? "cn" : "en";
}

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  resolvedTheme: "light" | "dark";
  t: (key: string) => string;
  medications: Medication[];
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  bedtimeTime: string;
  setBreakfastTime: (time: string) => void;
  setLunchTime: (time: string) => void;
  setDinnerTime: (time: string) => void;
  setBedtimeTime: (time: string) => void;
  addMedication: (med: Omit<Medication, "id">) => boolean;
  updateMedication: (id: string, med: Omit<Medication, "id">) => boolean;
  removeMedication: (id: string) => void;
  clearAllData: () => void;
  pendingIntake: PendingIntakeItem[];
  markPendingIntakeDone: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>("auto");
  const [language, setLanguageState] = useState<Language>("en");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [breakfastTime, setBreakfastTimeState] = useState("08:00");
  const [lunchTime, setLunchTimeState] = useState("12:00");
  const [dinnerTime, setDinnerTimeState] = useState("19:00");
  const [bedtimeTime, setBedtimeTimeState] = useState("22:00");
  const [pendingIntake, setPendingIntake] = useState<PendingIntakeItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const completedIntakeIdsRef = useRef<Set<string>>(new Set());

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (theme === "auto") {
      return systemScheme === "dark" ? "dark" : "light";
    }
    return theme;
  }, [theme, systemScheme]);

  const persistCompletedIntakeIds = useCallback(async () => {
    await AsyncStorage.setItem(
      "completedIntakeIds",
      JSON.stringify([...completedIntakeIdsRef.current])
    );
  }, []);

  const t = useCallback(
    (path: string) => {
      try {
        const keys = path.split(".");
        let current: any = messagesMap[language];
        for (const key of keys) {
          if (current && typeof current === "object" && key in current) {
            current = current[key];
          } else {
            return path;
          }
        }
        // 仅允许最终为 string；其它类型（含意外非 JSON 值）一律退回 path，并统一为 string
        const resolved = typeof current === "string" ? current : path;
        return String(resolved);
      } catch (e) {
        console.error(`Translation error for path "${path}":`, e);
        return String(path);
      }
    },
    [language]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [
        [, storedTheme],
        [, storedLanguage],
        [, storedMeds],
        [, storedPending],
        [, storedCompleted],
        [, bf],
        [, lu],
        [, di],
        [, bt],
      ] = await AsyncStorage.multiGet([
        "theme",
        "language",
        "medications",
        "pendingIntake",
        "completedIntakeIds",
        "breakfastTime",
        "lunchTime",
        "dinnerTime",
        "bedtimeTime",
      ]);
      if (cancelled) return;

      if (storedTheme === "auto" || storedTheme === "light" || storedTheme === "dark") {
        setThemeState(storedTheme);
      }
      if (isValidLanguage(storedLanguage)) {
        setLanguageState(storedLanguage);
      } else {
        setLanguageState(detectDeviceLanguage());
      }
      let loadedMedications: Medication[] = [];
      if (storedMeds) {
        try {
          loadedMedications = normalizeMedications(JSON.parse(storedMeds));
          setMedications(loadedMedications);
        } catch {
          /* ignore */
        }
      }
      const todayStr = new Date().toDateString();
      if (storedPending) {
        try {
          const parsed: PendingIntakeItem[] = JSON.parse(storedPending);
          const now = Date.now();
          let medIds: Set<string> | null = null;
          if (loadedMedications.length > 0) {
            medIds = new Set(loadedMedications.map((m) => m.id));
          }
          setPendingIntake(
            parsed.filter((p) => {
              if (now - p.createdAt > PENDING_INTAKE_TTL_MS) return false;
              if (medIds && !medIds.has(p.medicationId)) return false;
              return true;
            })
          );
        } catch {
          /* ignore */
        }
      }
      if (storedCompleted) {
        try {
          const parsed: string[] = JSON.parse(storedCompleted);
          completedIntakeIdsRef.current = new Set(
            parsed.filter((id) => id.endsWith(todayStr))
          );
          if (completedIntakeIdsRef.current.size !== parsed.length) {
            await AsyncStorage.setItem(
              "completedIntakeIds",
              JSON.stringify([...completedIntakeIdsRef.current])
            );
          }
        } catch {
          /* ignore */
        }
      }
      if (bf) setBreakfastTimeState(bf);
      if (lu) setLunchTimeState(lu);
      if (di) setDinnerTimeState(di);
      if (bt) setBedtimeTimeState(bt);

      setMounted(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void AsyncStorage.setItem("theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    void AsyncStorage.setItem("language", language);
  }, [language, mounted]);

  useEffect(() => {
    if (!mounted) return;
    void AsyncStorage.setItem("medications", JSON.stringify(medications));
  }, [medications, mounted]);

  useEffect(() => {
    if (!mounted) return;
    void AsyncStorage.setItem("pendingIntake", JSON.stringify(pendingIntake));
  }, [pendingIntake, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const prune = () => {
      const now = Date.now();
      setPendingIntake((prev) =>
        prev.filter((p) => now - p.createdAt <= PENDING_INTAKE_TTL_MS)
      );
    };
    const interval = setInterval(prune, 30000);
    prune();
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    void AsyncStorage.multiSet([
      ["breakfastTime", breakfastTime],
      ["lunchTime", lunchTime],
      ["dinnerTime", dinnerTime],
      ["bedtimeTime", bedtimeTime],
    ]);
  }, [breakfastTime, lunchTime, dinnerTime, bedtimeTime, mounted]);

  useEffect(() => {
    if (!mounted) return;
    void (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    })();
  }, [mounted]);

  /** 每日定时通知（应用可被杀后仍由系统触发） */
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    void (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted" || cancelled) return;

      await Notifications.cancelAllScheduledNotificationsAsync();

      const times: Record<TimeToTake, string> = {
        breakfast: breakfastTime,
        lunch: lunchTime,
        dinner: dinnerTime,
        bedtime: bedtimeTime,
      };

      const slots: TimeToTake[] = ["breakfast", "lunch", "dinner", "bedtime"];
      for (const slot of slots) {
        if (cancelled) return;
        const relevantMeds = medications.filter((m) => m.times.includes(slot));
        if (relevantMeds.length === 0) continue;

        const [h, min] = times[slot].split(":").map(Number);
        for (const med of relevantMeds) {
          const message = med.reminderCopy?.trim() || String((await copy(language)) || "");
          const dosageText = med.dosage
            ? ` (${t(`Home.dosageOptions.${dosageKeyForI18n(m.dosage)}`)})`
            : "";
          const medDetails = `${String(med.name || "")}${dosageText}`;
          const body = `${message}\n${t("Notifications.take")}${medDetails}`;

          try {
            await Notifications.scheduleNotificationAsync({
              identifier: `candy-slot-${slot}-${med.id}`,
              content: {
                title: t("Notifications.timeToTake"),
                body,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: h,
                minute: min,
              },
            });
          } catch {
            /* 单次失败不阻断 */
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    mounted,
    medications,
    breakfastTime,
    lunchTime,
    dinnerTime,
    bedtimeTime,
    language,
    t,
  ]);

  useEffect(() => {
    if (!mounted) return;

    const parseHHMMToToday = (hhmm: string, ref: Date): Date => {
      const [h, m] = hhmm.split(":").map(Number);
      const d = new Date(ref);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const checkScheduled = async () => {
      const now = new Date();
      const today = now.toDateString();

      const timeConfigs: Record<TimeToTake, string> = {
        breakfast: breakfastTime,
        lunch: lunchTime,
        dinner: dinnerTime,
        bedtime: bedtimeTime,
      };

      const completed = completedIntakeIdsRef.current;
      let completedPruned = false;
      for (const id of [...completed]) {
        if (!id.endsWith(today)) {
          completed.delete(id);
          completedPruned = true;
        }
      }
      if (completedPruned) {
        await persistCompletedIntakeIds();
      }

      setPendingIntake((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const toAdd: PendingIntakeItem[] = [];
        for (const [key, scheduledTime] of Object.entries(timeConfigs)) {
          const slot = key as TimeToTake;
          if (now < parseHHMMToToday(scheduledTime, now)) continue;

          const relevantMeds = medications.filter((m) => m.times.includes(slot));
          for (const med of relevantMeds) {
            const id = `${med.id}-${slot}-${today}`;
            if (existingIds.has(id)) continue;
            if (completed.has(id)) continue;
            toAdd.push({
              id,
              medicationId: med.id,
              timeSlot: slot,
              createdAt: Date.now(),
            });
            existingIds.add(id);
          }
        }
        if (toAdd.length === 0) return prev;
        return [...prev, ...toAdd];
      });
    };

    const interval = setInterval(() => {
      void checkScheduled();
    }, 30000);
    void checkScheduled();
    return () => clearInterval(interval);
  }, [
    mounted,
    breakfastTime,
    lunchTime,
    dinnerTime,
    bedtimeTime,
    medications,
    persistCompletedIntakeIds,
  ]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const setLanguage = (newLang: Language) => setLanguageState(newLang);

  const setBreakfastTime = (newTime: string) => setBreakfastTimeState(newTime);
  const setLunchTime = (newTime: string) => setLunchTimeState(newTime);
  const setDinnerTime = (newTime: string) => setDinnerTimeState(newTime);
  const setBedtimeTime = (newTime: string) => setBedtimeTimeState(newTime);

  const addMedication = (med: Omit<Medication, "id">) => {
    let isDuplicate = false;
    setMedications((prev) => {
      isDuplicate = prev.some((m) => medicationDataEqual(med, toMedicationData(m)));
      if (isDuplicate) return prev;
      return [...prev, { ...med, id: Date.now().toString() }];
    });
    return !isDuplicate;
  };

  const updateMedication = (id: string, updates: Omit<Medication, "id">) => {
    let isDuplicate = false;
    setMedications((prev) => {
      isDuplicate = prev.some(
        (m) => m.id !== id && medicationDataEqual(updates, toMedicationData(m))
      );
      if (isDuplicate) return prev;
      return prev.map((m) => (m.id === id ? { ...updates, id } : m));
    });
    return !isDuplicate;
  };

  const removeMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    setPendingIntake((prev) => prev.filter((p) => p.medicationId !== id));
    let removed = false;
    for (const cid of [...completedIntakeIdsRef.current]) {
      if (cid.startsWith(`${id}-`)) {
        completedIntakeIdsRef.current.delete(cid);
        removed = true;
      }
    }
    if (removed) void persistCompletedIntakeIds();
  };

  const markPendingIntakeDone = (itemId: string) => {
    setPendingIntake((prev) => prev.filter((p) => p.id !== itemId));
    completedIntakeIdsRef.current.add(itemId);
    void persistCompletedIntakeIds();
  };

  const clearAllData = async () => {
    setMedications([]);
    setThemeState("auto");
    await AsyncStorage.removeItem("language");
    setLanguageState(detectDeviceLanguage());
    setBreakfastTimeState("08:00");
    setLunchTimeState("12:00");
    setDinnerTimeState("19:00");
    setBedtimeTimeState("22:00");
    await AsyncStorage.multiRemove([
      "medications",
      "theme",
      "breakfastTime",
      "lunchTime",
      "dinnerTime",
      "bedtimeTime",
      "pendingIntake",
      "completedIntakeIds",
    ]);
    completedIntakeIdsRef.current = new Set();
    setPendingIntake([]);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        language,
        setLanguage,
        resolvedTheme,
        t,
        medications,
        breakfastTime,
        lunchTime,
        dinnerTime,
        bedtimeTime,
        setBreakfastTime,
        setLunchTime,
        setDinnerTime,
        setBedtimeTime,
        addMedication,
        updateMedication,
        removeMedication,
        clearAllData,
        pendingIntake,
        markPendingIntakeDone,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
