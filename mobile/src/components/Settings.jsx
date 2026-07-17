import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resetAllProgress } from "../data/storage";
import { colors, shadow } from "../theme";

export default function Settings({ state, setState }) {
  const [confirming, setConfirming] = useState(false);

  async function exportData() {
    try {
      await Share.share({ message: JSON.stringify(state) });
    } catch {
      // user cancelled share sheet, nothing to do
    }
  }

  function reset() {
    setState(resetAllProgress(state));
    setConfirming(false);
    Alert.alert("Progression réinitialisée", "Tes statistiques ont été remises à zéro.");
  }

  return (
    <ScrollView style={s.view} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={s.h2}>Réglages</Text>

      <View style={[s.panel, shadow]}>
        <Text style={s.h3}>Sauvegarde</Text>
        <Text style={s.muted}>
          Exporte tes données (mots ajoutés, statistiques) sous forme de texte que tu peux copier
          ou envoyer ailleurs par sécurité.
        </Text>
        <TouchableOpacity style={s.actionBtn} onPress={exportData}>
          <Ionicons name="share" size={16} color={colors.primary} />
          <Text style={s.actionText}>Exporter mes données</Text>
        </TouchableOpacity>
      </View>

      <View style={[s.panel, shadow]}>
        <Text style={s.h3}>Réinitialiser</Text>
        <Text style={s.muted}>
          Remet toutes les statistiques d'apprentissage à zéro (les mots ajoutés restent).
          Cette action est irréversible.
        </Text>
        {!confirming ? (
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.badBg }]} onPress={() => setConfirming(true)}>
            <Ionicons name="refresh" size={16} color={colors.bad} />
            <Text style={[s.actionText, { color: colors.bad }]}>Réinitialiser la progression</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.bad, flex: 1, justifyContent: "center" }]} onPress={reset}>
              <Text style={[s.actionText, { color: "white" }]}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { flex: 1, justifyContent: "center" }]} onPress={() => setConfirming(false)}>
              <Text style={s.actionText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[s.panel, shadow]}>
        <Text style={s.h3}>À propos</Text>
        <Text style={s.muted}>
          VocabMaster — apprends et retiens le vocabulaire anglais avec la répétition espacée,
          des flashcards, et des exercices variés. Toutes les données restent sur ton téléphone.
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  view: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  h2: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: colors.text },
  h3: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: colors.text },
  panel: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 16 },
  muted: { color: colors.muted, fontSize: 13, marginBottom: 12, lineHeight: 18 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignSelf: "flex-start",
  },
  actionText: { color: colors.primary, fontWeight: "600" },
});
