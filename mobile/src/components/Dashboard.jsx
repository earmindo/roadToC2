import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { getGlobalStats, getWeakestWords } from "../data/storage";
import { formatDuration } from "../utils";
import { colors } from "../theme";

export default function Dashboard({ state, onNavigate }) {
  const stats = getGlobalStats(state);
  const weakest = getWeakestWords(state, 8);

  return (
    <ScrollView style={s.view} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={s.h2}>Tableau de bord</Text>

      <View style={s.grid}>
        <StatCard label="Mots au total" value={stats.totalWords} />
        <StatCard label="Précision globale" value={`${stats.accuracy}%`} color={colors.primary} />
        <StatCard label="Maîtrisés" value={stats.masteredCount} color={colors.good} />
        <StatCard label="À travailler" value={stats.strugglingCount} color={colors.bad} />
        <StatCard label="Nouveaux" value={stats.newCount} />
        <StatCard label="Verbes irréguliers" value={stats.irregularCount} />
        <StatCard label="Temps de pratique" value={formatDuration(stats.totalPracticeMs)} />
        <StatCard label="Sessions" value={stats.sessionsCount} />
      </View>

      <View style={s.panel}>
        <Text style={s.h3}>Points faibles</Text>
        {weakest.length === 0 && (
          <Text style={s.muted}>Pas encore assez de données. Commence à pratiquer !</Text>
        )}
        {weakest.map((w) => (
          <View style={s.weakRow} key={w.id}>
            <Text style={{ flex: 1, fontWeight: "600" }}>{w.en}</Text>
            <Text style={{ flex: 1, color: colors.muted }}>{w.fr}</Text>
            <View style={[s.badge, w.rate < 0.4 ? s.badgeBad : s.badgeWarn]}>
              <Text style={w.rate < 0.4 ? s.badgeBadText : s.badgeWarnText}>
                {Math.round(w.rate * 100)}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={s.cta} onPress={() => onNavigate("practice-setup")}>
        <Text style={s.ctaText}>Commencer une session de pratique</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={s.card}>
      <Text style={[s.cardValue, color ? { color } : null]}>{value}</Text>
      <Text style={s.cardLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  view: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  h2: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: colors.text },
  h3: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    width: "47%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardValue: { fontSize: 22, fontWeight: "700", color: colors.text },
  cardLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  panel: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  muted: { color: colors.muted, fontSize: 13 },
  weakRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f5",
  },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeBad: { backgroundColor: colors.badBg },
  badgeWarn: { backgroundColor: colors.warnBg },
  badgeBadText: { color: colors.bad, fontWeight: "600", fontSize: 12 },
  badgeWarnText: { color: colors.warnText, fontWeight: "600", fontSize: 12 },
  cta: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  ctaText: { color: "white", fontWeight: "700", fontSize: 16 },
});
