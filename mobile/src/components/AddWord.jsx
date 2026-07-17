import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { addCustomWord } from "../data/storage";
import { colors } from "../theme";

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

  return (
    <View style={s.view}>
      <Text style={s.h2}>Ajouter un mot</Text>
      <View style={s.panel}>
        <Text style={s.label}>Mot en anglais</Text>
        <TextInput style={s.input} value={en} onChangeText={setEn} placeholder="ex: umbrella" />
        <Text style={s.label}>Traduction en français</Text>
        <TextInput style={s.input} value={fr} onChangeText={setFr} placeholder="ex: parapluie" />
        <TouchableOpacity style={s.cta} onPress={submit}>
          <Text style={s.ctaText}>Ajouter</Text>
        </TouchableOpacity>
        {!!msg && <Text style={s.success}>{msg}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  view: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  h2: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: colors.text },
  panel: { backgroundColor: colors.card, borderRadius: 14, padding: 16 },
  label: { fontSize: 14, color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 14,
  },
  cta: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: "center" },
  ctaText: { color: "white", fontWeight: "700", fontSize: 16 },
  success: { color: colors.good, fontWeight: "600", marginTop: 10 },
});
