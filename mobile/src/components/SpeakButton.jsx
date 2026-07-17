import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import * as Speech from "expo-speech";

export default function SpeakButton({ text, size = 20, style }) {
  function speak() {
    Speech.stop();
    Speech.speak(text, { language: "en-US", pitch: 1, rate: 0.92 });
  }

  return (
    <TouchableOpacity style={[s.btn, style]} onPress={speak} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={{ fontSize: size }}>🔊</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
});
