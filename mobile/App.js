import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { loadState, saveState } from "./src/data/storage";
import { colors } from "./src/theme";
import Dashboard from "./src/components/Dashboard";
import Collections from "./src/components/Collections";
import AddWord from "./src/components/AddWord";
import PracticeSetup from "./src/components/PracticeSetup";
import PracticeSession from "./src/components/PracticeSession";

const TABS = [
  { key: "dashboard", label: "Tableau de bord" },
  { key: "collections", label: "Collections" },
  { key: "practice-setup", label: "Pratiquer" },
  { key: "add-word", label: "Ajouter" },
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
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <Text style={styles.title}>🧠 VocabMaster</Text>
      </View>
      <View style={styles.nav}>
        {TABS.map((t) => {
          const active = view === t.key || (t.key === "practice-setup" && view === "practice-session");
          return (
            <TouchableOpacity key={t.key} style={[styles.navBtn, active && styles.navBtnActive]} onPress={() => goTo(t.key)}>
              <Text style={[styles.navText, active && styles.navTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {view === "dashboard" && <Dashboard state={state} onNavigate={goTo} />}
        {view === "collections" && <Collections state={state} setState={setState} />}
        {view === "add-word" && <AddWord state={state} setState={setState} />}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { color: "white", fontSize: 20, fontWeight: "700" },
  nav: { flexDirection: "row", backgroundColor: colors.primary, paddingHorizontal: 8, paddingBottom: 8, flexWrap: "wrap", gap: 4 },
  navBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.15)" },
  navBtnActive: { backgroundColor: colors.bg },
  navText: { color: "white", fontSize: 12 },
  navTextActive: { color: colors.primary, fontWeight: "700" },
});
