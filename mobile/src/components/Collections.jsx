import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { getCollections, deleteWord } from "../data/storage";
import { colors } from "../theme";

const LABELS = {
  irregularVerbs: "Verbes irréguliers",
  mastered: "Maîtrisés",
  struggling: "À travailler",
  newWords: "Nouveaux",
};

export default function Collections({ state, setState }) {
  const [active, setActive] = useState("irregularVerbs");
  const collections = getCollections(state);
  const list = collections[active];

  return (
    <View style={s.view}>
      <Text style={s.h2}>Collections</Text>
      <View style={s.tabs}>
        {Object.keys(LABELS).map((key) => (
          <TouchableOpacity
            key={key}
            style={[s.tab, active === key && s.tabActive]}
            onPress={() => setActive(key)}
          >
            <Text style={[s.tabText, active === key && s.tabTextActive]}>
              {LABELS[key]} ({collections[key].length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {list.length === 0 && <Text style={s.muted}>Aucun mot dans cette collection.</Text>}
        {list.map((w) => (
          <View style={s.row} key={w.id}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700" }}>
                {w.en}
                {w.extra ? ` (${w.extra.past} · ${w.extra.participle})` : ""}
              </Text>
              <Text style={s.muted}>{w.fr}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={s.badge}>
                <Text style={s.badgeText}>
                  {w.stats.seen ? Math.round((w.stats.correct / w.stats.seen) * 100) : 0}%
                </Text>
              </View>
              {w.custom && (
                <TouchableOpacity onPress={() => setState(deleteWord(state, w.id))}>
                  <Text style={{ color: colors.bad, fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  view: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  h2: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: colors.text },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 13, color: colors.text },
  tabTextActive: { color: "white" },
  muted: { color: colors.muted, fontSize: 13 },
  row: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: { backgroundColor: "#eef2ff", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { color: colors.primary, fontWeight: "600", fontSize: 12 },
});
