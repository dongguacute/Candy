import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { MaterialIcons } from "@expo/vector-icons";
import type { Theme } from "@candy/shared";
import { useAppContext } from "../context/AppContext";
import { dark, light } from "../theme";

function hhmmFromDate(d: Date): string {
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function dateFromHHMM(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export default function SettingsScreen() {
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    t,
    clearAllData,
    breakfastTime,
    lunchTime,
    dinnerTime,
    bedtimeTime,
    setBreakfastTime,
    setLunchTime,
    setDinnerTime,
    setBedtimeTime,
    resolvedTheme,
  } = useAppContext();
  const c = resolvedTheme === "dark" ? dark : light;

  const [tempTimes, setTempTimes] = useState({
    breakfast: breakfastTime,
    lunch: lunchTime,
    dinner: dinnerTime,
    bedtime: bedtimeTime,
  });
  const [showSaved, setShowSaved] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [picker, setPicker] = useState<null | keyof typeof tempTimes>(null);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  useEffect(() => {
    setTempTimes({
      breakfast: breakfastTime,
      lunch: lunchTime,
      dinner: dinnerTime,
      bedtime: bedtimeTime,
    });
  }, [breakfastTime, lunchTime, dinnerTime, bedtimeTime]);

  const isDirty =
    tempTimes.breakfast !== breakfastTime ||
    tempTimes.lunch !== lunchTime ||
    tempTimes.dinner !== dinnerTime ||
    tempTimes.bedtime !== bedtimeTime;

  const handleSave = () => {
    setBreakfastTime(tempTimes.breakfast);
    setLunchTime(tempTimes.lunch);
    setDinnerTime(tempTimes.dinner);
    setBedtimeTime(tempTimes.bedtime);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2500);
  };

  const onTimeChange = (_key: keyof typeof tempTimes) => (event: DateTimePickerEvent, d?: Date) => {
    if (event.type === "dismissed" || !d) {
      setPicker(null);
      return;
    }
    setPickerDate(d);
  };

  const openPicker = (key: keyof typeof tempTimes) => {
    setPickerDate(dateFromHHMM(tempTimes[key]));
    setPicker(key);
  };

  const confirmPicker = () => {
    if (!picker) return;
    setTempTimes((prev) => ({ ...prev, [picker]: hhmmFromDate(pickerDate) }));
    setPicker(null);
  };

  const testNotify = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const r = await Notifications.requestPermissionsAsync();
      if (r.status !== "granted") {
        Alert.alert(String(t("Settings.testNotificationDenied")));
        return;
      }
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: String(t("Settings.testNotificationTitle")),
        body: String(t("Settings.testNotificationBody")),
      },
      trigger: null,
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.sectionCard, { borderColor: c.border, backgroundColor: c.surface }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>{String(t("Settings.appearance"))}</Text>
        <View style={styles.rowWrap}>
          {(["auto", "light", "dark"] as Theme[]).map((k) => {
            const active = theme === k;
            return (
              <TouchableOpacity
                key={k}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? c.accentDark : c.border,
                    backgroundColor: active ? c.accent : c.surface,
                  },
                ]}
                onPress={() => setTheme(k)}
              >
                <Text style={{ color: active ? c.accentDark : c.text, fontWeight: "800" }}>
                  {String(t(`Settings.${k}`))}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.sectionCard, { borderColor: c.border, backgroundColor: c.surface }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>{String(t("Settings.language"))}</Text>
        <View style={styles.rowWrap}>
          {(["cn", "en"] as const).map((l) => {
            const active = language === l;
            return (
              <TouchableOpacity
                key={l}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? c.accentDark : c.border,
                    backgroundColor: active ? c.accent : c.surface,
                  },
                ]}
                onPress={() => setLanguage(l)}
              >
                <Text style={{ color: active ? c.accentDark : c.text, fontWeight: "800" }}>
                  {l === "cn" ? "简体中文" : "English"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.sectionCard, { borderColor: c.border, backgroundColor: c.surface }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          {String(t("Settings.notificationsSection"))}
        </Text>
        <Text style={[styles.sectionHint, { color: c.textMuted }]}>
          {String(t("Settings.notificationsHint"))}
        </Text>
        <TouchableOpacity
          style={[styles.notifyBtn, { borderColor: c.accent, backgroundColor: c.surface }]}
          onPress={() => void testNotify()}
        >
          <MaterialIcons name="notifications-active" size={22} color={c.text} />
          <Text style={{ color: c.text, fontWeight: "800", marginLeft: 8 }}>
            {String(t("Settings.testNotificationButton"))}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.sectionCard, { borderColor: c.border, backgroundColor: c.surface }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>{String(t("Settings.presetTimes"))}</Text>
        {(
          [
            ["breakfast", String(t("Settings.breakfast")), String(t("Settings.breakfastDesc"))] as const,
            ["lunch", String(t("Settings.lunch")), String(t("Settings.lunchDesc"))] as const,
            ["dinner", String(t("Settings.dinner")), String(t("Settings.dinnerDesc"))] as const,
            ["bedtime", String(t("Settings.bedtime")), String(t("Settings.bedtimeDesc"))] as const,
          ] as const
        ).map(([key, title, desc]) => (
          <View key={key} style={[styles.timeCard, { borderColor: c.border, backgroundColor: c.bg }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.timeTitle, { color: c.text }]}>{String(title)}</Text>
              <Text style={{ color: c.textMuted, fontSize: 13 }}>{String(desc)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.timeBtn, { borderColor: c.border, backgroundColor: c.surface }]}
              onPress={() => openPicker(key)}
            >
              <Text style={{ color: c.text, fontWeight: "800" }}>{String(tempTimes[key] ?? "")}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {picker && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setPicker(null)}>
          <View style={styles.pickerBackdrop}>
            <View style={[styles.pickerCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.pickerHeader}>
                <Text style={{ color: c.text, fontWeight: "800", fontSize: 16 }}>
                  {String(t("Settings.presetTimes"))}
                </Text>
                <View style={styles.pickerActions}>
                  <TouchableOpacity onPress={() => setPicker(null)}>
                    <Text style={{ color: c.textMuted, fontWeight: "700" }}>{String(t("Home.cancel"))}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmPicker}>
                    <Text style={{ color: c.accentDark, fontWeight: "900" }}>{String(t("Home.save"))}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                onChange={onTimeChange(picker)}
              />
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.saveRow}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: isDirty ? c.accent : c.border },
          ]}
          disabled={!isDirty}
          onPress={handleSave}
        >
          <MaterialIcons name="save" size={22} color={c.text} />
          <Text style={{ color: c.text, fontWeight: "900", marginLeft: 8 }}>
            {String(t("Settings.save"))}
          </Text>
        </TouchableOpacity>
        {showSaved ? (
          <Text style={{ color: "#16A34A", fontWeight: "800" }}>{String(t("Settings.saved"))}</Text>
        ) : null}
      </View>

      <View style={[styles.sectionCard, { borderColor: c.border, backgroundColor: c.surface }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>{String(t("Settings.disclaimerTitle"))}</Text>
        <Text style={[styles.sectionHint, { color: c.textMuted }]}>
          {String(t("Settings.disclaimerBody"))}
        </Text>
        <TouchableOpacity
          onPress={() => void Linking.openURL("https://github.com/dongguacute/Candy")}
          style={[styles.linkBtn, { borderColor: c.border, backgroundColor: c.bg }]}
        >
          <MaterialIcons name="open-in-new" size={20} color={c.text} />
          <Text style={{ color: c.text, marginLeft: 8, fontWeight: "700" }}>
            {String(t("Settings.sourceOnGitHub"))}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.danger,
          {
            borderColor: c.danger,
            backgroundColor:
              resolvedTheme === "dark" ? "rgba(248,113,113,0.12)" : "rgba(220,38,38,0.08)",
          },
        ]}
      >
        <View style={styles.dangerHeader}>
          <MaterialIcons name="warning-amber" size={20} color={c.danger} />
          <Text style={[styles.sectionTitle, { color: c.danger, marginTop: 0 }]}>
            {String(t("Settings.dangerZone"))}
          </Text>
        </View>
        <Text style={{ color: c.textMuted, marginBottom: 12 }}>{String(t("Settings.dangerDesc"))}</Text>
        {!showDanger ? (
          <TouchableOpacity
            style={[styles.dangerBtn, { backgroundColor: c.danger }]}
            onPress={() => setShowDanger(true)}
          >
            <MaterialIcons name="delete-forever" size={22} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "900", marginLeft: 8 }}>
              {String(t("Settings.clearAll"))}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.dangerRow}>
            <Text style={{ color: c.danger, fontWeight: "800", flex: 1 }}>
              {String(t("Settings.areYouSure"))}
            </Text>
            <View style={styles.dangerActions}>
              <TouchableOpacity
                style={[styles.dangerGhostBtn, { borderColor: c.border, backgroundColor: c.surface }]}
                onPress={() => setShowDanger(false)}
              >
                <Text style={{ color: c.textMuted, fontWeight: "800" }}>{String(t("Home.cancel"))}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dangerSolidBtn, { backgroundColor: c.danger }]}
                onPress={() => {
                  void clearAllData();
                  setShowDanger(false);
                  Alert.alert(String(t("Settings.allCleared")));
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>{String(t("Home.confirm"))}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48, gap: 14 },
  sectionCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", marginBottom: 10 },
  sectionHint: { marginBottom: 12, lineHeight: 20 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 96,
    alignItems: "center",
  },
  notifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: "flex-start",
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  timeTitle: { fontSize: 16, fontWeight: "800" },
  timeBtn: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 2,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 999,
    padding: 12,
    alignSelf: "flex-start",
  },
  danger: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 16,
  },
  dangerHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: "flex-start",
  },
  dangerRow: { gap: 12 },
  dangerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  dangerGhostBtn: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  dangerSolidBtn: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  pickerCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  pickerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
});
