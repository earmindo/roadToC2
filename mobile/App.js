import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { loadState, saveState } from "./src/data/storage";
import { colors } from "./src/theme";
import Dashboard from "./src/components/Dashboard";
import Collections from "./src/components/Collections";
import AddWord from "./src/components/AddWord";
import Settings from "./src/components/Settings";
import PracticeSetup from "./src/components/PracticeSetup";
import PracticeSession from "./src/components/PracticeSession";

const TABS = [
  { key: "dashboard", label: "Accueil", icon: "home" },
  { key: "collections", label: "Collections", icon: "layers" },
  { key: "practice-setup", label: "Pratiquer", icon: "flash" },
  { key: "add-word", label: "Ajouter", icon: "add-circle" },
  { key: "settings", label: "Réglages", icon: "settings" },
];

export default function App() {
  const [state, setState] = useState(null);
  const [view, setView] = useState("dashboard");
  const [practiceConfig, setPracticeConfig] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    loadState().then(setState);
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  if (!state) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text>Chargement…</Text>
      </SafeAreaView>
    );
  }

  function goTo(v) {
    setView(v);
  }

  function startPractice(mode, scope) {
    setPracticeConfig({ mode, scope });
    setSessionKey((k) => k + 1);
    setView("practice-session");
  }

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={{ flex: 1 }}>
        {view === "dashboard" && (
          <Dashboard state={state} onNavigate={goTo} onStartDue={() => startPractice("mcq", "due")} />
        )}
        {view === "collections" && <Collections state={state} setState={setState} />}
        {view === "add-word" && <AddWord state={state} setState={setState} />}
        {view === "settings" && <Settings state={state} setState={setState} />}
        {view === "practice-setup" && <PracticeSetup state={state} onStart={startPractice} />}
        {view === "practice-session" && practiceConfig && (
          <PracticeSession
            key={sessionKey}
            state={state}
            setState={setState}
            mode={practiceConfig.mode}
            scope={practiceConfig.scope}
            onFinish={() => goTo("dashboard")}
          />
        )}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = view === t.key || (t.key === "practice-setup" && view === "practice-session");
          return (
            <TouchableOpacity key={t.key} style={styles.tabBtn} onPress={() => goTo(t.key)}>
              <Ionicons name={t.icon} size={22} color={active ? colors.primary : colors.muted} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 8 : 10,
  },
  tabBtn: { flex: 1, alignItems: "center", gap: 2 },
  tabLabel: { fontSize: 11, color: colors.muted },
  tabLabelActive: { color: colors.primary, fontWeight: "700" },
});
