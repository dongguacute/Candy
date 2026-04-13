import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { dosageKeyForI18n, type Medication, type TimeToTake } from "@candy/shared";
import { useAppContext } from "../context/AppContext";
import { dark, light } from "../theme";

type MedModal = null | { type: "add" } | { type: "edit"; id: string };

export default function HomeScreen() {
  const {
    medications,
    addMedication,
    updateMedication,
    removeMedication,
    t,
    resolvedTheme,
  } = useAppContext();
  const c = resolvedTheme === "dark" ? dark : light;

  const [medModal, setMedModal] = useState<MedModal>(null);
  const [medToDelete, setMedToDelete] = useState<string | null>(null);
  const deletingMedication = medications.find((m) => m.id === medToDelete) ?? null;

  const [name, setName] = useState("");
  const [times, setTimes] = useState<TimeToTake[]>([]);
  const [dosage, setDosage] = useState("1");
  const [iconType, setIconType] = useState<"emoji" | "image">("emoji");
  const [iconValue, setIconValue] = useState("💊");
  const [reminderCopy, setReminderCopy] = useState("");

  const resetForm = () => {
    setName("");
    setTimes([]);
    setDosage("1");
    setIconType("emoji");
    setIconValue("💊");
    setReminderCopy("");
  };

  const fillFormFromMedication = (med: Medication) => {
    setName(med.name);
    setTimes([...med.times]);
    setDosage(med.dosage ?? "1");
    setIconType(med.iconType);
    setIconValue(med.iconValue);
    setReminderCopy(med.reminderCopy ?? "");
  };

  const timeOptions: { value: TimeToTake; label: string }[] = [
    { value: "breakfast", label: String(t("Settings.breakfast")) },
    { value: "lunch", label: String(t("Settings.lunch")) },
    { value: "dinner", label: String(t("Settings.dinner")) },
    { value: "bedtime", label: String(t("Settings.bedtime")) },
  ];

  const dosageOptions = [
    { value: "quarter", label: String(t("Home.dosageOptions.quarter")) },
    { value: "half", label: String(t("Home.dosageOptions.half")) },
    { value: "1", label: String(t("Home.dosageOptions.1")) },
    { value: "2", label: String(t("Home.dosageOptions.2")) },
    { value: "3", label: String(t("Home.dosageOptions.3")) },
    { value: "4", label: String(t("Home.dosageOptions.4")) },
    { value: "5", label: String(t("Home.dosageOptions.5")) },
    { value: "6", label: String(t("Home.dosageOptions.6")) },
  ];

  const handleTimeToggle = (time: TimeToTake) => {
    if (times.includes(time)) {
      setTimes(times.filter((x) => x !== time));
    } else {
      setTimes([...times, time]);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      const uri = a.base64
        ? `data:image/jpeg;base64,${a.base64}`
        : a.uri;
      setIconType("image");
      setIconValue(uri);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert(String(t("Home.errorName")));
      return;
    }
    if (times.length === 0) {
      Alert.alert(String(t("Home.errorTime")));
      return;
    }
    const payload = {
      name: name.trim(),
      times,
      dosage,
      iconType,
      iconValue,
      reminderCopy: reminderCopy.trim() || undefined,
    };
    if (medModal?.type === "edit") {
      if (!updateMedication(medModal.id, payload)) {
        Alert.alert(String(t("Home.errorDuplicate")));
        return;
      }
    } else {
      if (!addMedication(payload)) {
        Alert.alert(String(t("Home.errorDuplicate")));
        return;
      }
    }
    setMedModal(null);
    resetForm();
  };

  const renderMed = ({ item: med }: { item: Medication }) => (
    <View style={[styles.card, { borderColor: c.border, backgroundColor: c.surface }]}>
      <View style={[styles.iconCircle, { borderColor: c.border }]}>
        {med.iconType === "emoji" ? (
          <Text style={styles.emojiLarge}>{String(med.iconValue || "")}</Text>
        ) : (
          <Image source={{ uri: String(med.iconValue || "") }} style={styles.iconImg} />
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.medName, { color: c.text }]} numberOfLines={2}>
          {String(med.name ?? "")}
        </Text>
        <View style={styles.tagRow}>
          {med.times.map((timeKey) => (
            <View key={timeKey} style={[styles.tag, { borderColor: c.border }]}>
              <Text style={[styles.tagText, { color: c.textMuted }]}>
                {String(timeOptions.find((o) => o.value === timeKey)?.label ?? "")}
              </Text>
            </View>
          ))}
        </View>
      </View>
      {med.dosage ? (
        <View style={[styles.dosageBadge, { borderColor: c.accent }]}>
          <Text style={[styles.dosageText, { color: c.text }]}>
            {String(t(`Home.dosageOptions.${dosageKeyForI18n(med.dosage)}`))}
          </Text>
        </View>
      ) : null}
      <TouchableOpacity
        onPress={() => {
          fillFormFromMedication(med);
          setMedModal({ type: "edit", id: med.id });
        }}
        style={styles.iconBtn}
      >
        <MaterialIcons name="edit" size={22} color={c.accentDark} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMedToDelete(med.id)}
        style={[
          styles.iconBtn,
          styles.deleteIconBtn,
          {
            backgroundColor:
              resolvedTheme === "dark"
                ? "rgba(248,113,113,0.18)"
                : "rgba(220,38,38,0.1)",
          },
        ]}
      >
        <MaterialIcons name="close" size={22} color={c.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.text }]}>{String(t("Home.title"))}</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.accent }]}
          onPress={() => {
            resetForm();
            setMedModal({ type: "add" });
          }}
        >
          <MaterialIcons name="add" size={22} color={c.text} />
          <Text style={[styles.addBtnText, { color: c.text }]}>
            {String(t("Home.addMedication"))}
          </Text>
        </TouchableOpacity>
      </View>

      {medications.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="medication" size={72} color={c.border} />
          <Text style={[styles.emptyTitle, { color: c.textMuted }]}>
            {String(t("Home.noMedications"))}
          </Text>
          <Text style={{ color: c.textMuted, textAlign: "center" }}>
            {String(t("Home.addFirst"))}
          </Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(m) => m.id}
          renderItem={renderMed}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={!!medModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalPanel, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>
                {String(
                  medModal?.type === "edit"
                    ? t("Home.editMedication")
                    : t("Home.addMedication")
                )}
              </Text>
              <TouchableOpacity onPress={() => setMedModal(null)}>
                <MaterialIcons name="close" size={26} color={c.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.label, { color: c.textMuted }]}>
                {String(t("Home.medicationName"))}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={String(t("Home.placeholderName"))}
                placeholderTextColor={c.textMuted}
                style={[styles.input, { color: c.text, borderColor: c.border }]}
              />

              <Text style={[styles.label, { color: c.textMuted }]}>
                {String(t("Home.timeToTake"))}
              </Text>
              <View style={styles.rowWrap}>
                {timeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleTimeToggle(option.value)}
                    style={[
                      styles.chip,
                      {
                        borderColor: c.border,
                        backgroundColor: times.includes(option.value)
                          ? c.accent
                          : c.bg,
                      },
                    ]}
                  >
                    <Text style={{ color: c.text, fontWeight: "700" }}>
                      {String(option.label)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: c.textMuted }]}>
                {String(t("Home.dosage"))}
              </Text>
              <View style={styles.rowWrap}>
                {dosageOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setDosage(option.value)}
                    style={[
                      styles.chip,
                      {
                        borderColor: c.border,
                        backgroundColor:
                          dosage === option.value ? c.accent : c.bg,
                      },
                    ]}
                  >
                    <Text style={{ color: c.text, fontWeight: "700" }}>
                      {String(option.label)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: c.textMuted }]}>
                {String(t("Home.icon"))}
              </Text>
              <View style={[styles.iconRow, { borderColor: c.border }]}>
                <View style={[styles.iconCircle, { borderColor: c.border }]}>
                  {iconType === "emoji" ? (
                    <Text style={styles.emojiLarge}>{String(iconValue ?? "")}</Text>
                  ) : (
                    <Image source={{ uri: String(iconValue ?? "") }} style={styles.iconImg} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={iconType === "emoji" ? iconValue : "💊"}
                    onChangeText={(v) => {
                      setIconType("emoji");
                      setIconValue(v || "💊");
                    }}
                    style={[styles.input, { color: c.text, borderColor: c.border }]}
                    maxLength={4}
                  />
                  <TouchableOpacity
                    style={[styles.pickImgBtn, { backgroundColor: c.bg }]}
                    onPress={pickImage}
                  >
                    <MaterialIcons name="image" size={20} color={c.text} />
                    <Text style={{ color: c.text, marginLeft: 8 }}>
                      {String(t("Home.uploadImage"))}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.label, { color: c.textMuted }]}>
                {String(t("Home.reminderCopyLabel"))}
              </Text>
              <TextInput
                value={reminderCopy}
                onChangeText={setReminderCopy}
                placeholder={String(t("Home.reminderCopyPlaceholder"))}
                placeholderTextColor={c.textMuted}
                style={[styles.copyInput, { color: c.text, borderColor: c.border }]}
                multiline
                maxLength={80}
              />
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 6 }}>
                {String(t("Home.reminderCopyHint"))}
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setMedModal(null)}>
                <Text style={{ color: c.textMuted, fontWeight: "700" }}>
                  {String(t("Home.cancel"))}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: c.accent }]}
                onPress={handleSubmit}
              >
                <Text style={{ color: c.text, fontWeight: "800" }}>
                  {String(t("Home.save"))}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!medToDelete} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.confirmBox, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View
              style={[
                styles.confirmIconWrap,
                {
                  backgroundColor:
                    resolvedTheme === "dark"
                      ? "rgba(248,113,113,0.18)"
                      : "rgba(220,38,38,0.1)",
                },
              ]}
            >
              <MaterialIcons name="warning-amber" size={42} color={c.danger} />
            </View>
            <Text style={[styles.modalTitle, { color: c.text, marginTop: 12, textAlign: "center" }]}>
              {String(t("Home.confirmDelete"))}
            </Text>
            <Text style={{ color: c.textMuted, textAlign: "center", marginVertical: 12 }}>
              {String(t("Home.deleteWarning"))}
            </Text>
            {deletingMedication ? (
              <View style={[styles.deletingNameBadge, { borderColor: c.border }]}>
                <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: "700" }}>即将删除</Text>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: "800" }}>
                  {String(deletingMedication.name)}
                </Text>
              </View>
            ) : null}
            <View style={styles.confirmRow}>
              <TouchableOpacity
                style={[styles.cancelDeleteBtn, { borderColor: c.border, backgroundColor: c.bg }]}
                onPress={() => setMedToDelete(null)}
              >
                <Text style={{ color: c.textMuted, fontWeight: "800" }}>
                  {String(t("Home.cancel"))}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn, { backgroundColor: c.danger }]}
                onPress={() => {
                  if (medToDelete) removeMedication(medToDelete);
                  setMedToDelete(null);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  {String(t("Home.confirm"))}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: { marginBottom: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: "900" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  addBtnText: { fontWeight: "800" },
  list: { paddingBottom: 24, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
    marginBottom: 8,
  },
  cardBody: { flex: 1, minWidth: 0 },
  medName: { fontSize: 18, fontWeight: "800" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, fontWeight: "700" },
  dosageBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dosageText: { fontSize: 12, fontWeight: "700" },
  iconBtn: { padding: 6 },
  deleteIconBtn: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  emojiLarge: { fontSize: 28 },
  iconImg: { width: "100%", height: "100%" },
  empty: { alignItems: "center", marginTop: 48, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginTop: 16, marginBottom: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalPanel: {
    maxHeight: "92%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", flex: 1 },
  modalScroll: { maxHeight: 480 },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  label: { fontWeight: "700", marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  copyInput: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 84,
    textAlignVertical: "top",
  },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconRow: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 2,
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
  },
  pickImgBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 12,
    borderRadius: 999,
  },
  saveBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  confirmBox: {
    margin: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1.5,
  },
  confirmIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
  },
  deletingNameBadge: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: "100%",
    gap: 2,
  },
  confirmRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    width: "100%",
  },
  cancelDeleteBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  confirmDeleteBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
});
