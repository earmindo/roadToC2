import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getGlobalStats, getWeakestWords } from "../data/storage";
import { formatDuration } from "../utils";
import { colors, gradients, shadow } from "../theme";
import SpeakButton from "./SpeakButton";

export default function Dashboard({ state, onNavigate, onStartDue }) {
  const stats = getGlobalStats(state);
  const weakest = getWeakestWords(state, 6);

  return (
    <ScrollView style={s.view} contentContainerStyle={{ paddingBottom: 24 }}>
      <LinearGradient colors={gradients.header} style={s.hero}>
        <View style={{ flex: 1 }}>
          <Text style={s.heroLabel}>À réviser aujourd'hui</Text>
          <Text style={s.heroValue}>{stats.dueCount} mot{stats.dueCount !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity style={s.heroBtn} onPress={onStartDue}>
          <Ionicons name="play" size={18} color={colors.primary} />
          <Text style={s.heroBtnText}>Réviser</Text>
        </TouchableOpacity>
      </LinearGradient>

      {stats.dayStreak > 0 && (
        <View style={s.streakRow}>
          <Text style={{ fontSize: 20 }}>🔥</Text>
          <Text style={s.streakText}>{stats.dayStreak} jour{stats.dayStreak > 1 ? "s" : ""} de suite</Text>
        </View>
      )}

      <View style={s.grid}>
        <StatCard icon="library" label="Mots au total" value={stats.totalWords} />
        <StatCard icon="checkmark-circle" label="Précision" value={`${stats.accuracy}%`} color={colors.primary} />
        <StatCard icon="ribbon" label="Maîtrisés" value={stats.masteredCount} color={colors.good} />
        <StatCard icon="alert-circle" label="À travailler" value={stats.strugglingCount} color={colors.bad} />
        <StatCard icon="sparkles" label="Nouveaux" value={stats.newCount} />
        <StatCard icon="repeat" label="Verbes irrég." value={stats.irregularCount} />
        <StatCard icon="time" label="Temps pratiqué" value={formatDuration(stats.totalPracticeMs)} />
        <StatCard icon="flash" label="Sessions" value={stats.sessionsCount} />
      </View>

      <View style={[s.panel, shadow]}>
        <Text style={s.h3}>Points faibles</Text>
        {weakest.length === 0 && (
          <Text style={s.muted}>Pas encore assez de données. Commence à pratiquer !</Text>
        )}
        {weakest.map((w) => (
          <View style={s.weakRow} key={w.id}>
            <SpeakButton text={w.en} size={15} style={{ width: 28, height: 28, borderRadius: 14 }} />
            <Text style={{ flex: 1, fontWeight: "600", marginLeft: 8 }}>{w.en}</Text>
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
        <Ionicons name="add-circle" size={18} color="white" />
        <Text style={s.ctaText}>Nouvelle session personnalisée</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[s.card, shadow]}>
      <Ionicons name={icon} size={18} color={color || colors.muted} />
      <Text style={[s.cardValue, color ? { color } : null]}>{value}</Text>
      <Text style={s.cardLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  view: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  hero: {
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  heroLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  heroValue: { color: "white", fontSize: 24, fontWeight: "700", marginTop: 2 },
  heroBtn: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroBtnText: { color: colors.primary, fontWeight: "700" },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, paddingHorizontal: 4 },
  streakText: { fontWeight: "600", color: colors.text },
  h3: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, width: "47%" },
  cardValue: { fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 6 },
  cardLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  panel: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 16 },
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
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  ctaText: { color: "white", fontWeight: "700", fontSize: 15 },
});
