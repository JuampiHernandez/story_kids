"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import "@/lib/browser-speech-recognition";
import type {
  BrowserSpeechRecognitionConstructor,
  BrowserSpeechRecognitionEvent,
} from "@/lib/browser-speech-recognition";

export type { BrowserSpeechRecognitionConstructor, BrowserSpeechRecognitionEvent };

export const VOICE_AUTO_START_KEY = "storypop:auto-start-story";
const VOICE_COMMANDS_ENABLED_KEY = "storypop:voice-commands-enabled";

export type VoiceCommandIntent =
  | "start_story"
  | "go_books"
  | "open_first_book"
  | "play_audio"
  | "pause_audio"
  | "repeat_audio"
  | "stop_audio"
  | "next_page"
  | "previous_page"
  | "home"
  | "my_books"
  | "community_books";

type UseVoiceCommandsOptions = {
  enabled?: boolean;
  lang?: string;
  onCommand: (intent: VoiceCommandIntent, transcript: string) => void;
};

export type VoiceCommandStatus =
  | "idle"
  | "starting"
  | "browser-listening"
  | "transcribing"
  | "blocked"
  | "unsupported"
  | "error";

const commandAliases: Record<VoiceCommandIntent, string[]> = {
  start_story: ["start", "start story", "start a story", "begin", "begin story", "new story"],
  go_books: [
    "books",
    "my books",
    "go books",
    "go to books",
    "open books",
    "open my books",
    "library",
    "go to library",
    "storybook",
    "story book",
  ],
  open_first_book: [
    "open book",
    "open first book",
    "select book",
    "select a book",
    "select first book",
    "read book",
    "read a book",
    "read this book",
    "read first book",
    "play book",
    "play again",
  ],
  play_audio: ["play", "resume", "continue", "play story", "resume story", "read aloud", "read this story"],
  pause_audio: ["pause", "pause story", "pause audio", "wait"],
  repeat_audio: [
    "repeat",
    "replay",
    "reproduce",
    "repeat story",
    "replay story",
    "reproduce story",
    "repeat book",
    "replay book",
    "reproduce book",
    "read again",
    "start over",
  ],
  stop_audio: ["stop", "stop audio", "stop reading"],
  next_page: ["next", "next page", "go next", "turn page"],
  previous_page: ["previous", "previous page", "back page", "go back"],
  home: ["home", "go home", "back home"],
  my_books: ["my books", "show my books"],
  community_books: ["community books", "show community books", "community shelf"],
};

const wakePrefixes = ["storypop", "story pop", "hey storypop", "hey story pop", "reader"];
const politePrefixes = ["please", "can you", "could you", "would you", "i want to"];
const politeSuffixes = ["please", "now"];
const recognitionRestartDelayMs = 2500;
const browserRecognitionGraceMs = 8000;
const fallbackChunkMs = 2600;
const fallbackPauseMs = 500;

function normalizeTranscript(transcript: string) {
  return transcript
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripPhrasePrefix(text: string, prefixes: string[]) {
  const prefix = prefixes.find((candidate) => text === candidate || text.startsWith(`${candidate} `));
  return prefix ? text.slice(prefix.length).trim() : text;
}

function stripPhraseSuffix(text: string, suffixes: string[]) {
  const suffix = suffixes.find((candidate) => text === candidate || text.endsWith(` ${candidate}`));
  return suffix ? text.slice(0, -suffix.length).trim() : text;
}

function getCommandText(transcript: string) {
  const normalized = normalizeTranscript(transcript);
  if (!normalized) return "";

  const withoutWakeWord = stripPhrasePrefix(normalized, wakePrefixes);
  const withoutPolitePrefix = stripPhrasePrefix(withoutWakeWord, politePrefixes);
  return stripPhraseSuffix(withoutPolitePrefix, politeSuffixes);
}

export function matchVoiceCommand(transcript: string): VoiceCommandIntent | null {
  const commandText = getCommandText(transcript);
  if (!commandText) return null;

  for (const [intent, aliases] of Object.entries(commandAliases) as Array<[VoiceCommandIntent, string[]]>) {
    if (aliases.some((alias) => commandText === alias || commandText.endsWith(` ${alias}`))) return intent;
  }

  return null;
}

export function requestVoiceAutoStartStory() {
  window.sessionStorage.setItem(VOICE_AUTO_START_KEY, "1");
}

export function useVoiceCommands({ enabled = true, lang = "en-US", onCommand }: UseVoiceCommandsOptions) {
  const onCommandRef = useRef(onCommand);
  const lastCommandAtRef = useRef(0);
  const [activationCount, setActivationCount] = useState(0);
  const [status, setStatus] = useState<VoiceCommandStatus>("idle");
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastError, setLastError] = useState("");

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    if (window.sessionStorage.getItem(VOICE_COMMANDS_ENABLED_KEY) === "1") {
      setActivationCount((count) => Math.max(count, 1));
    }
  }, []);

  const activate = useCallback(async () => {
    setStatus("starting");
    setLastError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        setLastError("This browser cannot access the microphone.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      window.sessionStorage.setItem(VOICE_COMMANDS_ENABLED_KEY, "1");
      setActivationCount((count) => count + 1);
    } catch {
      setStatus("blocked");
      setLastError("Microphone permission is blocked.");
    }
  }, []);

  useEffect(() => {
    if (!enabled || activationCount === 0) {
      if (!enabled) setStatus("idle");
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let stopped = false;
    let restartTimer: number | null = null;
    let browserRecognitionTimer: number | null = null;
    let fallbackTimer: number | null = null;
    let mediaStream: MediaStream | null = null;
    let activeRecorder: MediaRecorder | null = null;
    let recognition: InstanceType<BrowserSpeechRecognitionConstructor> | null = null;

    const emitCommand = (transcript: string) => {
      setLastTranscript(transcript);
      const command = matchVoiceCommand(transcript);
      if (!command) return false;

      const now = Date.now();
      if (now - lastCommandAtRef.current < 1200) return true;
      lastCommandAtRef.current = now;
      onCommandRef.current(command, transcript);
      return true;
    };

    const clearBrowserRecognitionTimer = () => {
      if (!browserRecognitionTimer) return;
      window.clearTimeout(browserRecognitionTimer);
      browserRecognitionTimer = null;
    };

    const stopMediaStream = () => {
      activeRecorder = null;
      mediaStream?.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    };

    const recordFallbackChunk = async () => {
      if (stopped || !navigator.mediaDevices || !("MediaRecorder" in window)) return;

      try {
        setStatus("transcribing");
        mediaStream = mediaStream || (await navigator.mediaDevices.getUserMedia({ audio: true }));
        if (stopped || !mediaStream) {
          stopMediaStream();
          return;
        }

        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(mediaStream);
        activeRecorder = recorder;

        const audio = await new Promise<Blob>((resolve) => {
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) chunks.push(event.data);
          };
          recorder.onstop = () => {
            resolve(new Blob(chunks, { type: "audio/webm" }));
          };
          recorder.start();
          window.setTimeout(() => {
            if (recorder.state !== "inactive") recorder.stop();
          }, fallbackChunkMs);
        });

        if (stopped || audio.size === 0) return;

        const formData = new FormData();
        formData.append("audio", audio);
        const response = await fetch("/api/stt", { method: "POST", body: formData });
        if (response.ok) {
          const data = (await response.json()) as { transcript?: string };
          if (data.transcript) emitCommand(data.transcript);
        } else {
          setStatus("error");
          setLastError("Speech transcription failed.");
        }
      } catch {
        setStatus("blocked");
        setLastError("Microphone permission is blocked.");
        stopMediaStream();
      } finally {
        if (!stopped) {
          fallbackTimer = window.setTimeout(recordFallbackChunk, fallbackPauseMs);
        }
      }
    };

    const startFallbackRecognition = () => {
      if (fallbackTimer || activeRecorder || stopped) return;
      clearBrowserRecognitionTimer();
      try {
        recognition?.stop();
      } catch {
        // Some browsers throw if recognition has already stopped.
      }
      void recordFallbackChunk();
    };

    if (!Recognition) {
      if (!navigator.mediaDevices || !("MediaRecorder" in window)) {
        setStatus("unsupported");
        setLastError("Voice commands are not supported in this browser.");
        return;
      }
      startFallbackRecognition();
      return () => {
        stopped = true;
        if (fallbackTimer) window.clearTimeout(fallbackTimer);
        if (activeRecorder?.state !== "inactive") activeRecorder?.stop();
        stopMediaStream();
      };
    }

    recognition = new Recognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    const startRecognition = () => {
      if (stopped) return;
      try {
        recognition?.start();
        setStatus("browser-listening");
        setLastError("");
      } catch {
        setStatus("error");
        setLastError("Voice recognition could not start.");
        // The browser can throw if start is called while recognition is already active.
      }
    };

    const scheduleRestart = () => {
      if (stopped || restartTimer) return;
      restartTimer = window.setTimeout(() => {
        restartTimer = null;
        startRecognition();
      }, recognitionRestartDelayMs);
    };

    recognition.onresult = (event) => {
      clearBrowserRecognitionTimer();
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript || "";
        emitCommand(transcript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        stopped = true;
        setStatus("blocked");
        setLastError("Microphone permission is blocked.");
        return;
      }
      scheduleRestart();
    };

    recognition.onend = scheduleRestart;
    startRecognition();
    browserRecognitionTimer = window.setTimeout(startFallbackRecognition, browserRecognitionGraceMs);

    return () => {
      stopped = true;
      if (restartTimer) window.clearTimeout(restartTimer);
      clearBrowserRecognitionTimer();
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      try {
        recognition?.stop();
      } catch {
        // Some browsers throw if recognition has already stopped.
      }
      if (activeRecorder?.state !== "inactive") activeRecorder?.stop();
      stopMediaStream();
    };
  }, [activationCount, enabled, lang]);

  return { activate, lastError, lastTranscript, status };
}
