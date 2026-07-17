import AsyncStorage from "@react-native-async-storage/async-storage";
import { IRREGULAR_VERBS } from "./irregularVerbs";
import { COMMON_WORDS } from "./commonWords";

const STORAGE_KEY = "vocabmaster_state_v1";

const BOX_MASTERED_THRESHOLD = 4;
const MIN_ATTEMPTS_FOR_STATUS = 3;
const MAX_BOX = 6;
// Days to wait before the next review, indexed by box level (spaced repetition)
const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 7, 14, 30];
const RELAPSE_DELAY_MS = 10 * 60 * 1000; // 10 min, used when an answer is wrong

function daysToMs(days) {
  return days * 24 * 60 * 60 * 1000;
}

function defaultStats() {
  return {
    box: 0,
    seen: 0,
    correct: 0,
    incorrect: 0,
    lastSeen: null,
    streak: 0,
    nextReview: Date.now(),
  };
}

function buildInitialWords() {
  const all = [...IRREGULAR_VERBS, ...COMMON_WORDS];
  const words = {};
  for (const w of all) words[w.id] = { ...w, custom: false, manualStatus: null, stats: defaultStats() };
  return words;
}

function migrateWord(w) {
  return {
    ...w,
    manualStatus: w.manualStatus ?? null,
    stats: {
      box: w.stats?.box ?? 0,
      seen: w.stats?.seen ?? 0,
      correct: w.stats?.correct ?? 0,
      incorrect: w.stats?.incorrect ?? 0,
      lastSeen: w.stats?.lastSeen ?? null,
      streak: w.stats?.streak ?? 0,
      nextReview: w.stats?.nextReview ?? Date.now(),
    },
  };
}

export async function loadState() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const state = { words: buildInitialWords(), sessions: [], createdAt: Date.now() };
    await saveState(state);
    return state;
  }
  try {
    const parsed = JSON.parse(raw);
    const builtinAll = [...IRREGULAR_VERBS, ...COMMON_WORDS];
    const words = {};
    for (const id of Object.keys(parsed.words)) {
      words[id] = migrateWord(parsed.words[id]);
    }
    for (const w of builtinAll) {
      if (!words[w.id]) words[w.id] = { ...w, custom: false, manualStatus: null, stats: defaultStats() };
    }
    return { ...parsed, words, sessions: parsed.sessions ?? [] };
  } catch {
    const state = { words: buildInitialWords(), sessions: [], createdAt: Date.now() };
    await saveState(state);
    return state;
  }
}

export async function saveState(state) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function addCustomWord(state, en, fr, category = "custom") {
  const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const words = {
    ...state.words,
    [id]: { id, en, fr, category, custom: true, manualStatus: null, stats: defaultStats() },
  };
  return { ...state, words };
}

export function updateWord(state, id, { en, fr }) {
  const w = state.words[id];
  if (!w) return state;
  return { ...state, words: { ...state.words, [id]: { ...w, en, fr } } };
}

export function deleteWord(state, id) {
  const words = { ...state.words };
  delete words[id];
  return { ...state, words };
}

export function recordAnswer(state, id, isCorrect) {
  const words = { ...state.words };
  const w = words[id];
  if (!w) return state;
  const stats = { ...w.stats };
  stats.seen += 1;
  stats.lastSeen = Date.now();
  if (isCorrect) {
    stats.correct += 1;
    stats.streak += 1;
    stats.box = Math.min(MAX_BOX, stats.box + 1);
    stats.nextReview = Date.now() + daysToMs(BOX_INTERVAL_DAYS[stats.box]);
  } else {
    stats.incorrect += 1;
    stats.streak = 0;
    stats.box = Math.max(0, stats.box - 1);
    stats.nextReview = Date.now() + RELAPSE_DELAY_MS;
  }
  words[id] = { ...w, stats };
  return { ...state, words };
}

// Anki-style 4-grade review, used by the flashcard mode
export function recordReview(state, id, grade) {
  const words = { ...state.words };
  const w = words[id];
  if (!w) return state;
  const stats = { ...w.stats };
  stats.seen += 1;
  stats.lastSeen = Date.now();
  if (grade === "again") {
    stats.incorrect += 1;
    stats.streak = 0;
    stats.box = 0;
    stats.nextReview = Date.now() + RELAPSE_DELAY_MS;
  } else if (grade === "hard") {
    stats.streak = 0;
    stats.box = Math.max(0, stats.box - 1);
    stats.nextReview = Date.now() + daysToMs(BOX_INTERVAL_DAYS[stats.box]);
  } else if (grade === "good") {
    stats.correct += 1;
    stats.streak += 1;
    stats.box = Math.min(MAX_BOX, stats.box + 1);
    stats.nextReview = Date.now() + daysToMs(BOX_INTERVAL_DAYS[stats.box]);
  } else if (grade === "easy") {
    stats.correct += 1;
    stats.streak += 1;
    stats.box = Math.min(MAX_BOX, stats.box + 2);
    stats.nextReview = Date.now() + daysToMs(BOX_INTERVAL_DAYS[stats.box]);
  }
  words[id] = { ...w, stats };
  return { ...state, words };
}

export function setManualStatus(state, id, status) {
  const w = state.words[id];
  if (!w) return state;
  return { ...state, words: { ...state.words, [id]: { ...w, manualStatus: status } } };
}

export function getWordStatus(w) {
  if (w.category === "irregularVerbs") return "irregularVerbs";
  if (w.manualStatus === "mastered" || w.manualStatus === "struggling" || w.manualStatus === "newWords") {
    return w.manualStatus;
  }
  const { seen, correct, box } = w.stats;
  if (seen < MIN_ATTEMPTS_FOR_STATUS) return "newWords";
  const rate = correct / seen;
  if (box >= BOX_MASTERED_THRESHOLD && rate >= 0.75) return "mastered";
  if (rate < 0.5 || box <= 1) return "struggling";
  return "newWords";
}

export function getCollections(state) {
  const collections = { irregularVerbs: [], mastered: [], struggling: [], newWords: [] };
  for (const w of Object.values(state.words)) collections[getWordStatus(w)].push(w);
  return collections;
}

export function getDueWords(state) {
  const now = Date.now();
  return Object.values(state.words)
    .filter((w) => w.stats.nextReview <= now)
    .sort((a, b) => a.stats.nextReview - b.stats.nextReview);
}

export function getGlobalStats(state) {
  const words = Object.values(state.words);
  let seen = 0, correct = 0, incorrect = 0;
  for (const w of words) {
    seen += w.stats.seen;
    correct += w.stats.correct;
    incorrect += w.stats.incorrect;
  }
  const collections = getCollections(state);
  const totalPracticeMs = state.sessions.reduce((sum, s) => sum + (s.end - s.start), 0);
  return {
    totalWords: words.length,
    seen, correct, incorrect,
    accuracy: seen > 0 ? Math.round((correct / seen) * 100) : 0,
    masteredCount: collections.mastered.length,
    strugglingCount: collections.struggling.length,
    newCount: collections.newWords.length,
    irregularCount: collections.irregularVerbs.length,
    totalPracticeMs,
    sessionsCount: state.sessions.length,
    dueCount: getDueWords(state).length,
    dayStreak: getDayStreak(state),
  };
}

function dateKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function getDayStreak(state) {
  const days = new Set(state.sessions.map((s) => dateKey(s.end)));
  if (days.size === 0) return 0;
  const oneDay = 24 * 60 * 60 * 1000;
  let cursor = Date.now();
  if (!days.has(dateKey(cursor))) {
    cursor -= oneDay;
    if (!days.has(dateKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor -= oneDay;
  }
  return streak;
}

export function getWeakestWords(state, limit = 10) {
  const words = Object.values(state.words).filter((w) => w.stats.seen > 0);
  return words
    .map((w) => ({ ...w, rate: w.stats.correct / w.stats.seen }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, limit);
}

export function addSession(state, session) {
  return { ...state, sessions: [...state.sessions, session] };
}

export function resetAllProgress(state) {
  const words = {};
  for (const id of Object.keys(state.words)) {
    words[id] = { ...state.words[id], manualStatus: null, stats: defaultStats() };
  }
  return { ...state, words, sessions: [] };
}
