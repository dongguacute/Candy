import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { dosageKeyForI18n, type TimeToTake } from "@candy/shared";
import { useAppContext } from "../context/AppContext";
import { dark, light } from "../theme";

export default function PendingScreen() {
  const { medications, t, pendingIntake, markPendingIntakeDone, resolvedTheme } =
    useAppContext();
  const c = resolvedTheme === "dark" ? dark : light;

  const timeOptions: { value: TimeToTake; label: string }[] = [
    { value: "breakfast", label: String(t("Settings.breakfast")) },
    { value: "lunch", label: String(t("Settings.lunch")) },
    { value: "dinner", label: String(t("Settings.dinner")) },
    { value: "bedtime", label: String(t("Settings.bedtime")) },
  ];

  const pendingVisible = pendingIntake.filter((item) =>
    medications.some((m) => m.id === item.medicationId)
  );

  if (pendingVisible.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <MaterialIcons name="pending-actions" size={64} color={c.border} />
        <Text style={[styles.emptyTitle, { color: c.textMuted }]}>
          {String(t("Pending.empty"))}
        </Text>
        <Text style={{ color: c.textMuted, textAlign: "center", paddingHorizontal: 24 }}>
          {String(t("Pending.hint"))}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Text style={[styles.hint, { color: c.textMuted }]}>{String(t("Pending.hint"))}</Text>
      <FlatList
        data={pendingVisible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const med = medications.find((m) => m.id === item.medicationId);
          if (!med) return null;
          const slotLabel =
            timeOptions.find((o) => o.value === item.timeSlot)?.label ?? item.timeSlot;
          return (
            <View
              style={[styles.card, { borderColor: c.border, backgroundColor: c.surface }]}
            >
              <View style={styles.cardMain}>
                <Text style={[styles.medName, { color: c.text }]}>{String(med.name || "")}</Text>
                <Text style={{ color: c.textMuted, marginTop: 4 }}>
                  {String(t("Pending.slot"))}: {String(slotLabel || "")}
                  {med.dosage
                    ? ` · ${String(t(`Home.dosageOptions.${dosageKeyForI18n(med.dosage)}`))}`
                    : ""}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: c.accent }]}
                onPress={() => markPendingIntakeDone(item.id)}
                activeOpacity={0.82}
              >
                <MaterialIcons name="check-circle" size={22} color={c.text} />
                <Text style={[styles.doneText, { color: c.text }]}>
                  {String(t("Pending.taken"))}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginTop: 16, marginBottom: 8 },
  hint: { marginBottom: 10, fontSize: 14 },
  list: { paddingBottom: 28, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  cardMain: { flex: 1 },
  medName: { fontSize: 17, fontWeight: "700" },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
  },
  doneText: { fontWeight: "700" },
});
