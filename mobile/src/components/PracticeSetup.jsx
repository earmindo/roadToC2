import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { getCollections, getDueWords } from "../data/storage";
import { colors, shadow } from "../theme";

const MODES = [
  { key: "mcq", label: "QCM", desc: "Choisis la bonne traduction parmi 4.", icon: "list" },
  { key: "typing", label: "Écriture", desc: "Écris la traduction toi-même.", icon: "create" },
  { key: "match", label: "Association", desc: "Relie les mots à leur traduction.", icon: "git-network" },
  { key: "flashcards", label: "Flashcards", desc: "Retourne la carte, comme Anki.", icon: "albums" },
  { key: "listening", label: "Écoute", desc: "Écoute le mot et retrouve-le.", icon: "headset" },
];

const SCOPES = {
  due: "Dû aujourd'hui (recommandé)",
  all: "Tous les mots",
  irregularVerbs: "Verbes irréguliers",
  struggling: "Mots à travailler",
  newWords: "Nouveaux mots",
  mastered: "Mots maîtrisés",
};

export default function PracticeSetup({ state, onStart }) {
  const [mode, setMode] = useState("mcq");
  const [scope, setScope] = useState("due");
  const collections = getCollections(state);

  function countFor(sc) {
    if (sc === "all") return Object.values(state.words).length;
    if (sc === "due") return getDueWords(state).length;
    return collections[sc].length;
  }

  const availableCount = countFor(scope);
  const disabled = availableCount < (mode === "mcq" ? 4 : 1);

  return (
    <ScrollView style={s.view} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={s.h2}>Nouvelle session</Text>

      <View style={[s.panel, shadow]}>
        <Text style={s.h3}>Mode</Text>
        <View style={s.modeGrid}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[s.modeCard, mode === m.key && s.modeCardActive]}
              onPress={() => setMode(m.key)}
            >
              <Ionicons name={m.icon} size={18} color={mode === m.key ? colors.primary : colors.muted} />
              <Text style={{ fontWeight: "700", marginTop: 4 }}>{m.label}</Text>
              <Text style={s.muted}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[s.panel, shadow]}>
        <Text style={s.h3}>Collection</Text>
        <View style={s.pickerWrap}>
          <Picker selectedValue={scope} onValueChange={setScope}>
            {Object.entries(SCOPES).map(([key, label]) => (
              <Picker.Item key={key} label={`${label} · ${countFor(key)}`} value={key} />
            ))}
          </Picker>
        </View>
        <Text style={s.muted}>{availableCount} mot(s) disponible(s)</Text>
      </View>

      <TouchableOpacity
        style={[s.cta, disabled && s.ctaDisabled]}
        disabled={disabled}
        onPress={() => onStart(mode, scope)}
      >
        <Ionicons name="play" size={18} color="white" />
        <Text style={s.ctaText}>Démarrer</Text>
      </TouchableOpacity>
      {disabled && (
        <Text style={s.muted}>
          {mode === "mcq" ? "Le QCM nécessite au moins 4 mots dans cette collection." : "Aucun mot disponible dans cette collection."}
        </Text>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  view: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  h2: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: colors.text },
  h3: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  panel: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 16 },
  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  modeCard: {
    width: "47%",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.card,
  },
  modeCardActive: { borderColor: colors.primary, backgroundColor: "#eef2ff" },
  muted: { color: colors.muted, fontSize: 12, marginTop: 4 },
  pickerWrap: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 6 },
  cta: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  ctaDisabled: { backgroundColor: "#b8b8d9" },
  ctaText: { color: "white", fontWeight: "700", fontSize: 16 },
});
