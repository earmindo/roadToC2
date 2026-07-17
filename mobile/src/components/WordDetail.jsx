import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { deleteWord, updateWord, setManualStatus } from "../data/storage";
import { colors, shadow } from "../theme";
import SpeakButton from "./SpeakButton";

const STATUS_LABELS = {
  mastered: "Maîtrisé",
  struggling: "À travailler",
  newWords: "Nouveau",
};

export default function WordDetail({ word, state, setState, onClose }) {
  const [editing, setEditing] = useState(false);
  const [en, setEn] = useState(word?.en ?? "");
  const [fr, setFr] = useState(word?.fr ?? "");

  if (!word) return null;

  function saveEdit() {
    setState(updateWord(state, word.id, { en: en.trim(), fr: fr.trim() }));
    setEditing(false);
  }

  function override(status) {
    setState(setManualStatus(state, word.id, status));
  }

  function remove() {
    setState(deleteWord(state, word.id));
    onClose();
  }

  const accuracy = word.stats.seen ? Math.round((word.stats.correct / word.stats.seen) * 100) : null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, shadow]}>
          <ScrollView>
            <View style={s.headerRow}>
              {editing ? (
                <TextInput style={s.editInput} value={en} onChangeText={setEn} autoFocus />
              ) : (
                <Text style={s.title}>{word.en}</Text>
              )}
              <SpeakButton text={word.en} />
            </View>

            {editing ? (
              <TextInput style={s.editInput} value={fr} onChangeText={setFr} placeholder="Traduction" />
            ) : (
              <Text style={s.subtitle}>{word.fr}</Text>
            )}

            {word.extra && (
              <Text style={s.muted}>Prétérit : {word.extra.past} · Participe : {word.extra.participle}</Text>
            )}

            <View style={s.statsRow}>
              <Stat label="Vues" value={word.stats.seen} />
              <Stat label="Réussite" value={accuracy !== null ? `${accuracy}%` : "—"} />
              <Stat label="Niveau" value={`${word.stats.box}/6`} />
            </View>

            {word.category !== "irregularVerbs" && (
              <>
                <Text style={s.sectionLabel}>Classer manuellement</Text>
                <View style={s.chipRow}>
                  {["mastered", "struggling", "newWords"].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[s.chip, word.manualStatus === st && s.chipActive]}
                      onPress={() => override(word.manualStatus === st ? null : st)}
                    >
                      <Text style={[s.chipText, word.manualStatus === st && s.chipTextActive]}>
                        {STATUS_LABELS[st]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {word.manualStatus && (
                  <Text style={s.muted}>Classement manuel actif (remplace le calcul automatique).</Text>
                )}
              </>
            )}

            <View style={s.actionsRow}>
              {word.custom && !editing && (
                <TouchableOpacity style={s.actionBtn} onPress={() => setEditing(true)}>
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                  <Text style={s.actionText}>Modifier</Text>
                </TouchableOpacity>
              )}
              {editing && (
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.goodBg }]} onPress={saveEdit}>
                  <Ionicons name="checkmark" size={16} color={colors.good} />
                  <Text style={[s.actionText, { color: colors.good }]}>Enregistrer</Text>
                </TouchableOpacity>
              )}
              {word.custom && (
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.badBg }]} onPress={remove}>
                  <Ionicons name="trash" size={16} color={colors.bad} />
                  <Text style={[s.actionText, { color: colors.bad }]}>Supprimer</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Stat({ label, value }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "80%" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 10 },
  editInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, fontSize: 16, marginBottom: 8, flex: 1 },
  muted: { color: colors.muted, fontSize: 12, marginBottom: 10 },
  statsRow: { flexDirection: "row", gap: 10, marginVertical: 12 },
  statBox: { flex: 1, backgroundColor: colors.bg, borderRadius: 10, padding: 10, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted },
  sectionLabel: { fontWeight: "700", marginTop: 8, marginBottom: 8, color: colors.text },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: "white", fontWeight: "700" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primaryLight },
  actionText: { color: colors.primary, fontWeight: "600" },
  closeBtn: { marginTop: 16, alignItems: "center", padding: 12 },
  closeText: { color: colors.muted, fontWeight: "600" },
});
