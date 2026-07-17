import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCollections } from "../data/storage";
import { colors, shadow } from "../theme";
import WordDetail from "./WordDetail";

const TABS = [
  { key: "irregularVerbs", label: "Verbes irrég.", icon: "repeat" },
  { key: "mastered", label: "Maîtrisés", icon: "ribbon" },
  { key: "struggling", label: "À travailler", icon: "alert-circle" },
  { key: "newWords", label: "Nouveaux", icon: "sparkles" },
];

export default function Collections({ state, setState }) {
  const [active, setActive] = useState("irregularVerbs");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const collections = getCollections(state);
  const list = collections[active];

  const filtered = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter((w) => w.en.toLowerCase().includes(q) || w.fr.toLowerCase().includes(q));
  }, [list, query]);

  const selectedWord = selected ? state.words[selected] : null;

  return (
    <View style={s.view}>
      <Text style={s.h2}>Collections</Text>

      <View style={s.searchBox}>
        <Ionicons name="search" size={16} color={colors.muted} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un mot..."
          placeholderTextColor={colors.muted}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
        <View style={s.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[s.tab, active === t.key && s.tabActive]}
              onPress={() => setActive(t.key)}
            >
              <Ionicons name={t.icon} size={14} color={active === t.key ? "white" : colors.muted} />
              <Text style={[s.tabText, active === t.key && s.tabTextActive]}>
                {t.label} ({collections[t.key].length})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {filtered.length === 0 && <Text style={s.muted}>Aucun mot trouvé.</Text>}
        {filtered.map((w) => (
          <TouchableOpacity style={[s.row, shadow]} key={w.id} onPress={() => setSelected(w.id)}>
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
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedWord && (
        <WordDetail word={selectedWord} state={state} setState={setState} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  view: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  h2: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: colors.text },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  tabs: { flexDirection: "row", gap: 6, marginBottom: 12 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 12, color: colors.text },
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
  badge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { color: colors.primary, fontWeight: "600", fontSize: 12 },
});
