import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getCollections } from "../data/storage";
import { colors } from "../theme";

const MODES = [
  { key: "mcq", label: "QCM", desc: "Choisis la bonne traduction parmi 4." },
  { key: "typing", label: "Écriture", desc: "Écris la traduction toi-même." },
  { key: "match", label: "Association", desc: "Relie les mots à leur traduction." },
  { key: "flashcards", label: "Flashcards", desc: "Retourne la carte, comme Anki." },
];

const SCOPES = {
  all: "Tous les mots",
  irregularVerbs: "Verbes irréguliers",
  struggling: "Mots à travailler",
  newWords: "Nouveaux mots",
  mastered: "Mots maîtrisés",
};

export default function PracticeSetup({ state, onStart }) {
  const [mode, setMode] = useState("mcq");
  const [scope, setScope] = useState("all");
  const collections = getCollections(state);

  const availableCount =
    scope === "all" ? Object.values(state.words).length : collections[scope].length;
  const disabled = availableCount < (mode === "mcq" ? 4 : 1);

  return (
    <ScrollView style={s.view} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={s.h2}>Nouvelle session</Text>

      <View style={s.panel}>
        <Text style={s.h3}>Mode</Text>
        <View style={s.modeGrid}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[s.modeCard, mode === m.key && s.modeCardActive]}
              onPress={() => setMode(m.key)}
            >
              <Text style={{ fontWeight: "700" }}>{m.label}</Text>
              <Text style={s.muted}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.panel}>
        <Text style={s.h3}>Collection</Text>
        <View style={s.pickerWrap}>
          <Picker selectedValue={scope} onValueChange={setScope}>
            {Object.entries(SCOPES).map(([key, label]) => (
              <Picker.Item key={key} label={label} value={key} />
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
        <Text style={s.ctaText}>Démarrer</Text>
      </TouchableOpacity>
      {disabled && mode === "mcq" && (
        <Text style={s.muted}>Le QCM nécessite au moins 4 mots dans cette collection.</Text>
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
  cta: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: "center" },
  ctaDisabled: { backgroundColor: "#b8b8d9" },
  ctaText: { color: "white", fontWeight: "700", fontSize: 16 },
});
