import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { addCustomWord, deleteWord } from "../data/storage";
import { colors, shadow } from "../theme";
import SpeakButton from "./SpeakButton";

export default function AddWord({ state, setState }) {
  const [en, setEn] = useState("");
  const [fr, setFr] = useState("");
  const [msg, setMsg] = useState("");

  function submit() {
    if (!en.trim() || !fr.trim()) return;
    setState(addCustomWord(state, en.trim(), fr.trim()));
    setMsg(`"${en}" ajouté !`);
    setEn("");
    setFr("");
    setTimeout(() => setMsg(""), 2000);
  }

  const customWords = Object.values(state.words)
    .filter((w) => w.custom)
    .sort((a, b) => Number(b.id.split("_")[1]) - Number(a.id.split("_")[1]));

  return (
    <ScrollView style={s.view} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={s.h2}>Ajouter un mot</Text>
      <View style={[s.panel, shadow]}>
        <Text style={s.label}>Mot en anglais</Text>
        <TextInput style={s.input} value={en} onChangeText={setEn} placeholder="ex: umbrella" autoCapitalize="none" />
        <Text style={s.label}>Traduction en français</Text>
        <TextInput style={s.input} value={fr} onChangeText={setFr} placeholder="ex: parapluie" autoCapitalize="none" />
        <TouchableOpacity style={s.cta} onPress={submit}>
          <Ionicons name="add" size={18} color="white" />
          <Text style={s.ctaText}>Ajouter</Text>
        </TouchableOpacity>
        {!!msg && <Text style={s.success}>{msg}</Text>}
      </View>

      {customWords.length > 0 && (
        <View style={[s.panel, shadow]}>
          <Text style={s.label}>Tes mots ajoutés ({customWords.length})</Text>
          {customWords.map((w) => (
            <View style={s.wordRow} key={w.id}>
              <SpeakButton text={w.en} size={14} style={{ width: 28, height: 28, borderRadius: 14 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ fontWeight: "600" }}>{w.en}</Text>
                <Text style={s.muted}>{w.fr}</Text>
              </View>
              <TouchableOpacity onPress={() => setState(deleteWord(state, w.id))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash" size={16} color={colors.bad} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  view: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  h2: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: colors.text },
  panel: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 16 },
  label: { fontSize: 14, color: "#374151", marginBottom: 6, fontWeight: "600" },
  muted: { color: colors.muted, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 14,
  },
  cta: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  ctaText: { color: "white", fontWeight: "700", fontSize: 16 },
  success: { color: colors.good, fontWeight: "600", marginTop: 10 },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f5",
  },
});
