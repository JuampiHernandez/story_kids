"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  BookOpen,
  Home,
  LoaderCircle,
  Mic,
  Pause,
  Play,
} from "lucide-react";
import { VoiceOrb } from "@/components/voice-orb";
import { StorypopLogo } from "@/components/storypop-logo";
import type {
  NarrationLine,
  Scene,
  StorySession,
  StoryTurnResponse,
  VoiceCastMember,
  VoiceTrait,
} from "@/lib/story-schema";
import {
  DEFAULT_STORY_SETTINGS,
  loadStorySettings,
  STORY_SETTINGS_CHANGED_EVENT,
  type StoryParentSettings,
} from "@/lib/story-settings";
import { SettingsAvatarLink } from "@/components/settings-avatar-link";
import { hasGeneratedStoryImageUrl } from "@/lib/story-image-utils";

type StageMode = "idle" | "listening" | "thinking" | "speaking" | "painting";

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionConstructor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    webkitAudioContext?: typeof AudioContext;
  }
}

const thinkingPrompt = "Great idea. I’m dreaming up a cool story now.";
const listenSilenceMs = 1900;
const minimumListenMs = 4500;
const maxListenMs = 14000;

const speakerCardClassByTrait: Record<VoiceCastMember["trait"], string> = {
  narrator: "speaker-card-narrator",
  brave: "speaker-card-brave",
  tiny: "speaker-card-tiny",
  wise: "speaker-card-wise",
  silly: "speaker-card-silly",
  gentle: "speaker-card-gentle",
};

type ActiveSpeaker = Pick<VoiceCastMember, "displayName" | "speakerId"> & {
  trait: VoiceTrait;
};

function emojiForSpeaker(speakerId: string, displayName: string, trait: VoiceTrait): string {
  const id = speakerId.toLowerCase();
  const hint = `${displayName}`.toLowerCase();

  if (id === "narrator" || trait === "narrator") return "📖";
  if (trait === "tiny" || /\bbaby\b|\btoddler\b|\btiny\b/.test(hint)) return "👶";
  if (trait === "wise") return "🦉";
  if (trait === "silly" || /\bdog\b|\bpupp(y|ies)\b/.test(hint)) return "🐶";
  if (/\bcat\b|\bkitten\b/.test(hint)) return "🐱";
  if (trait === "brave") {
    if (/\bboy\b|\bdad\b|\bgrandpa\b|\bsir\b|\bking\b|\bprince\b|\bwolf\b|\bdragon\b/.test(hint)) {
      return "👦";
    }

    return "👧";
  }
  if (trait === "gentle") return "🤗";
  return "✨";
}

export function ChildStoryStage() {
  const [parentSettings, setParentSettings] = useState<StoryParentSettings>(DEFAULT_STORY_SETTINGS);
  const [mode, setMode] = useState<StageMode>("idle");
  const [hasStarted, setHasStarted] = useState(false);
  const [storyEnded, setStoryEnded] = useState(false);
  const [session, setSession] = useState<StorySession | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [caption, setCaption] = useState("Press Start and tell me your story idea.");
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeLine, setActiveLine] = useState<NarrationLine | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startListeningRef = useRef<() => Promise<void>>(async () => {});
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioResolveRef = useRef<(() => void) | null>(null);
  const currentSpeechResolveRef = useRef<(() => void) | null>(null);
  const currentSpeechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const storyRunRef = useRef(0);
  const isPausedRef = useRef(false);
  const resumeWaitersRef = useRef<Array<() => void>>([]);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const maxListenTimerRef = useRef<number | null>(null);
  const listeningTranscriptRef = useRef("");
  const didSubmitListeningRef = useRef(false);
  const audioUrlCacheRef = useRef(new Map<string, string>());
  const audioPromiseCacheRef = useRef(new Map<string, Promise<string | null>>());

  const openingPrompt = useMemo(() => {
    const name = parentSettings.childName.trim() || "friend";
    return `Hi ${name}. What should our story be about?`;
  }, [parentSettings.childName]);

  useEffect(() => {
    const refresh = () => setParentSettings(loadStorySettings());
    const timeout = window.setTimeout(refresh, 0);
    window.addEventListener("storage", refresh);
    window.addEventListener(STORY_SETTINGS_CHANGED_EVENT, refresh);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(STORY_SETTINGS_CHANGED_EVENT, refresh);
    };
  }, []);

  const imageUrlBySceneRef = useRef(new Map<string, string>());
  const imagePromiseCacheRef = useRef(new Map<string, Promise<string | null>>());

  const shareUrl = useMemo(() => {
    if (!session) return "";
    return `/story/${session.id}`;
  }, [session]);

  const activeSpeaker = useMemo<ActiveSpeaker | null>(() => {
    if (!activeLine) return null;

    return (
      session?.voiceCast.find((member) => member.speakerId === activeLine.speakerId) || {
        speakerId: activeLine.speakerId,
        displayName: activeLine.speakerName,
        trait: activeLine.speakerId === "narrator" ? "narrator" : "gentle",
      }
    );
  }, [activeLine, session?.voiceCast]);

  const waitUntilResumed = useCallback(
    () =>
      new Promise<void>((resolve) => {
        if (!isPausedRef.current) {
          resolve();
          return;
        }

        resumeWaitersRef.current.push(resolve);
      }),
    [],
  );

  const setStoryPaused = useCallback((paused: boolean) => {
    isPausedRef.current = paused;
    setIsPaused(paused);

    if (paused) {
      currentAudioRef.current?.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.pause();
      return;
    }

    if (currentAudioRef.current?.paused) {
      void currentAudioRef.current.play();
    }
    if ("speechSynthesis" in window) window.speechSynthesis.resume();
    const waiters = resumeWaitersRef.current;
    resumeWaitersRef.current = [];
    waiters.forEach((resolve) => resolve());
  }, []);

  const stopCurrentPlayback = useCallback(() => {
    currentAudioRef.current?.pause();
    currentAudioRef.current = null;
    currentAudioResolveRef.current?.();
    currentAudioResolveRef.current = null;

    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    currentSpeechUtteranceRef.current = null;
    currentSpeechResolveRef.current?.();
    currentSpeechResolveRef.current = null;
  }, []);

  const shouldStopStory = useCallback((runId: number) => runId !== storyRunRef.current, []);

  const speakBrowserFallback = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return Promise.resolve();

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;

    return new Promise<void>((resolve) => {
      const finish = () => {
        if (currentSpeechUtteranceRef.current === utterance) {
          currentSpeechUtteranceRef.current = null;
          currentSpeechResolveRef.current = null;
        }
        resolve();
      };
      currentSpeechUtteranceRef.current = utterance;
      currentSpeechResolveRef.current = finish;
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
      if (isPausedRef.current) window.speechSynthesis.pause();
    });
  }, []);

  const fetchTtsUrl = useCallback(async (text: string, speakerId: string, sessionId?: string) => {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
          speakerId,
          sessionId,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("audio")) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.error("TTS fetch failed", error);
    }

    return null;
  }, []);

  const playAudioUrl = useCallback(async (url: string) => {
    const audio = new Audio(url);
    currentAudioRef.current = audio;
    await new Promise<void>((resolve) => {
      const finish = () => {
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
          currentAudioResolveRef.current = null;
        }
        resolve();
      };
      currentAudioResolveRef.current = finish;
      audio.onended = finish;
      audio.onerror = finish;
      if (!isPausedRef.current) void audio.play();
    });
  }, []);

  const speakNarrator = useCallback(
    async (text: string, sessionId?: string) => {
      const url = await fetchTtsUrl(text, "narrator", sessionId || session?.id);
      if (url) {
        await playAudioUrl(url);
        URL.revokeObjectURL(url);
        return;
      }

      await speakBrowserFallback(text);
    },
    [fetchTtsUrl, playAudioUrl, session?.id, speakBrowserFallback],
  );

  const playCue = useCallback((kind: "start" | "listen" | "success" | "error") => {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return;

    const context = audioContextRef.current || new AudioContextConstructor();
    audioContextRef.current = context;
    if (context.state === "suspended") void context.resume();

    const notes =
      kind === "start"
        ? [523.25, 659.25]
        : kind === "listen"
          ? [783.99]
          : kind === "success"
            ? [659.25, 880]
            : [220, 196];

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startsAt = context.currentTime + index * 0.11;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startsAt);
      gain.gain.exponentialRampToValueAtTime(0.08, startsAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.16);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + 0.18);
    });
  }, []);

  const clearListeningTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxListenTimerRef.current) {
      window.clearTimeout(maxListenTimerRef.current);
      maxListenTimerRef.current = null;
    }
  }, []);

  const clearAssetCaches = useCallback(() => {
    audioUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
    audioUrlCacheRef.current.clear();
    audioPromiseCacheRef.current.clear();
    imageUrlBySceneRef.current.clear();
    imagePromiseCacheRef.current.clear();
  }, []);

  const getLineAudioUrl = useCallback(
    (scene: Scene, lineIndex: number, sessionId: string) => {
      const line = scene.lines[lineIndex];
      const cacheKey = `${sessionId}:${scene.id}:${lineIndex}`;
      const cachedUrl = audioUrlCacheRef.current.get(cacheKey);
      if (cachedUrl) return Promise.resolve(cachedUrl);

      const cachedPromise = audioPromiseCacheRef.current.get(cacheKey);
      if (cachedPromise) return cachedPromise;

      const promise = fetchTtsUrl(line.text, line.speakerId, sessionId).then((url) => {
        if (url) audioUrlCacheRef.current.set(cacheKey, url);
        audioPromiseCacheRef.current.delete(cacheKey);
        return url;
      });

      audioPromiseCacheRef.current.set(cacheKey, promise);
      return promise;
    },
    [fetchTtsUrl],
  );

  const preloadSceneAudio = useCallback(
    (scene: Scene, sessionId: string) => {
      return Promise.all(scene.lines.map((_, index) => getLineAudioUrl(scene, index, sessionId)));
    },
    [getLineAudioUrl],
  );

  const requestSceneImage = useCallback(
    async (storySession: StorySession, scene: Scene) => {
      if (hasGeneratedStoryImageUrl(scene.imageUrl)) {
        imageUrlBySceneRef.current.set(scene.id, scene.imageUrl);
        return scene.imageUrl;
      }

      const cachedUrl = imageUrlBySceneRef.current.get(scene.id);
      if (cachedUrl) return cachedUrl;

      const cachedPromise = imagePromiseCacheRef.current.get(scene.id);
      if (cachedPromise) return cachedPromise;

      const promise = (async () => {
        try {
          const response = await fetch("/api/story/image", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              sessionId: storySession.id,
              sceneId: scene.id,
              imageQualityTier: parentSettings.imageQualityTier,
            }),
          });

          if (!response.ok) return null;

          const data = (await response.json()) as { sceneId: string; imageUrl?: string };
          if (!hasGeneratedStoryImageUrl(data.imageUrl)) return null;

          imageUrlBySceneRef.current.set(data.sceneId, data.imageUrl);
          setSession((previous) => {
            if (!previous || previous.id !== storySession.id) return previous;
            return {
              ...previous,
              scenes: previous.scenes.map((candidate) =>
                candidate.id === data.sceneId ? { ...candidate, imageUrl: data.imageUrl } : candidate,
              ),
            };
          });
          setCurrentScene((previous) =>
            previous?.id === data.sceneId ? { ...previous, imageUrl: data.imageUrl } : previous,
          );
          return data.imageUrl;
        } catch (error) {
          console.error("Image generation failed", error);
          return null;
        } finally {
          imagePromiseCacheRef.current.delete(scene.id);
        }
      })();

      imagePromiseCacheRef.current.set(scene.id, promise);
      return promise;
    },
    [parentSettings.imageQualityTier],
  );

  const preloadStoryAssets = useCallback(
    (storySession: StorySession) => {
      storySession.scenes.slice(0, 3).forEach((scene) => {
        void preloadSceneAudio(scene, storySession.id);
      });

      void (async () => {
        for (const scene of storySession.scenes.slice(3)) {
          await preloadSceneAudio(scene, storySession.id);
        }
      })();

      storySession.scenes.forEach((scene) => {
        void requestSceneImage(storySession, scene);
      });
    },
    [preloadSceneAudio, requestSceneImage],
  );

  const waitForSceneImage = useCallback(
    async (storySession: StorySession, scene: Scene) => {
      const cachedUrl =
        imageUrlBySceneRef.current.get(scene.id) || (hasGeneratedStoryImageUrl(scene.imageUrl) ? scene.imageUrl : null);

      if (cachedUrl) return cachedUrl;

      setCaption(`Painting page ${scene.sceneNumber}...`);
      const imageUrl = await requestSceneImage(storySession, scene);

      if (!imageUrl) {
        throw new Error("Story image generation failed");
      }

      return imageUrl;
    },
    [requestSceneImage],
  );

  const waitForInitialImages = useCallback(
    async (storySession: StorySession) => {
      const targetReadyCount = Math.max(1, Math.ceil(storySession.scenes.length * 0.6));
      const scenesToPrepare = storySession.scenes.slice(0, targetReadyCount);

      for (let index = 0; index < scenesToPrepare.length; index += 1) {
        const scene = scenesToPrepare[index];
        setCaption(`Painting your book... ${index}/${targetReadyCount}`);
        await waitForSceneImage(storySession, scene);
      }

      setCaption(`Painting your book... ${targetReadyCount}/${targetReadyCount}`);
    },
    [waitForSceneImage],
  );

  const playLine = useCallback(
    async (scene: Scene, lineIndex: number, sessionId: string, runId: number) => {
      if (shouldStopStory(runId)) return;
      await waitUntilResumed();
      if (shouldStopStory(runId)) return;

      const line = scene.lines[lineIndex];
      setActiveLine(line);
      setCaption(line.text);

      const url = await getLineAudioUrl(scene, lineIndex, sessionId);
      if (shouldStopStory(runId)) return;
      await waitUntilResumed();
      if (shouldStopStory(runId)) return;

      if (url) {
        await playAudioUrl(url);
        return;
      }

      await speakBrowserFallback(line.text);
    },
    [getLineAudioUrl, playAudioUrl, shouldStopStory, speakBrowserFallback, waitUntilResumed],
  );

  const playScene = useCallback(
    async (scene: Scene, storySession: StorySession, nextScenes: Scene[], runId: number) => {
      if (shouldStopStory(runId)) return;
      await waitUntilResumed();
      if (shouldStopStory(runId)) return;

      setMode("painting");
      setActiveLine(null);
      const currentSceneAudioReady = preloadSceneAudio(scene, storySession.id);
      nextScenes.forEach((nextScene) => {
        void preloadSceneAudio(nextScene, storySession.id);
      });
      const imageUrl = await waitForSceneImage(storySession, scene);
      setCurrentScene({ ...scene, imageUrl });
      setSpokenTranscript("");
      setError("");
      await new Promise((resolve) => setTimeout(resolve, 260));
      if (shouldStopStory(runId)) return;
      await waitUntilResumed();
      if (shouldStopStory(runId)) return;
      await currentSceneAudioReady;
      if (shouldStopStory(runId)) return;

      setMode("speaking");

      for (let index = 0; index < scene.lines.length; index += 1) {
        await playLine(scene, index, storySession.id, runId);
        if (shouldStopStory(runId)) return;
      }

      setMode("painting");
    },
    [playLine, preloadSceneAudio, shouldStopStory, waitForSceneImage, waitUntilResumed],
  );

  const playStory = useCallback(
    async (storySession: StorySession) => {
      const runId = storyRunRef.current;
      for (let index = 0; index < storySession.scenes.length; index += 1) {
        const scene = storySession.scenes[index];
        const nextScenes = storySession.scenes.slice(index + 1, index + 3);
        await playScene(scene, storySession, nextScenes, runId);
        if (shouldStopStory(runId)) return;
      }

      setMode("idle");
      setCaption("The end.");
      setActiveLine(null);
      await new Promise((resolve) => setTimeout(resolve, 3600));
      if (shouldStopStory(runId)) return;
      await waitUntilResumed();
      if (shouldStopStory(runId)) return;

      const endPrompt = "Are you still awake? If you want a brand new story, press Start.";
      setMode("speaking");
      setCaption(endPrompt);
      await speakNarrator(endPrompt, storySession.id);
      if (shouldStopStory(runId)) return;
      setMode("idle");
      setStoryEnded(true);
      setHasStarted(false);
      setIsGenerating(false);
      setCurrentScene(null);
      setSession(null);
      setCaption("Are you still awake? Want a new story?");
      setActiveLine(null);
    },
    [playScene, shouldStopStory, speakNarrator, waitUntilResumed],
  );

  const submitTranscript = useCallback(
    async (transcript: string) => {
      const runId = storyRunRef.current;
      const trimmedTranscript = transcript.trim();
      if (!trimmedTranscript) {
        playCue("error");
        setError("I couldn’t hear that. Tap Start and try again.");
        setMode("idle");
        setHasStarted(false);
        setIsGenerating(false);
        return;
      }

      setMode("speaking");
      setCaption(thinkingPrompt);
      setSpokenTranscript(trimmedTranscript);
      setError("");
      setIsGenerating(true);
      playCue("success");

      try {
        const storyPromise = fetch("/api/story/turn", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            childName: parentSettings.childName.trim() || DEFAULT_STORY_SETTINGS.childName,
            childAgeRange: parentSettings.childAgeRange,
            storyEnergy: parentSettings.storyEnergy,
            transcript: trimmedTranscript,
            sessionId: session?.id,
          }),
        });
        await speakNarrator(thinkingPrompt);
        if (shouldStopStory(runId)) return;
        setMode("thinking");
        setCaption("Writing and drawing your book...");

        const response = await storyPromise;
        if (shouldStopStory(runId)) return;

        if (!response.ok) {
          throw new Error("Story turn failed");
        }

        const data = (await response.json()) as StoryTurnResponse;
        if (shouldStopStory(runId)) return;
        setSession(data.session);
        preloadStoryAssets(data.session);
        if (!data.session.scenes.length) {
          throw new Error("Story has no scenes");
        }
        await waitForInitialImages(data.session);
        if (shouldStopStory(runId)) return;
        await playStory(data.session);
      } catch (unknownError) {
        if (shouldStopStory(runId)) return;
        console.error(unknownError);
        playCue("error");
        setError(
          unknownError instanceof Error && unknownError.message === "Story image generation failed"
            ? "I couldn’t paint the page. Tap Start to try again."
            : "The story cloud hiccuped. Tap Start to try again.",
        );
        setMode("idle");
        setHasStarted(false);
        setIsGenerating(false);
        setActiveLine(null);
      }
    },
    [
      playCue,
      playStory,
      preloadStoryAssets,
      parentSettings.childAgeRange,
      parentSettings.childName,
      parentSettings.storyEnergy,
      session,
      shouldStopStory,
      speakNarrator,
      waitForInitialImages,
    ],
  );

  const startMediaRecorderFallback = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    const analyserContext = AudioContextConstructor ? new AudioContextConstructor() : null;
    let animationFrame = 0;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      try {
        await analyserContext?.close();
      } catch {
        // Closing an already-closed audio context is harmless.
      }
      stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      if (didSubmitListeningRef.current) return;
      didSubmitListeningRef.current = true;
      const audio = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", audio);
      const response = await fetch("/api/stt", { method: "POST", body: formData });
      const data = (await response.json()) as { transcript?: string };
      await submitTranscript(data.transcript || "");
    };

    recorder.start();

    const stopRecorder = () => {
      if (recorder.state !== "inactive") recorder.stop();
    };

    if (!analyserContext) {
      window.setTimeout(stopRecorder, maxListenMs);
      return;
    }

    if (analyserContext.state === "suspended") await analyserContext.resume();
    const source = analyserContext.createMediaStreamSource(stream);
    const analyser = analyserContext.createAnalyser();
    const samples = new Uint8Array(analyser.fftSize);
    source.connect(analyser);

    const startedAt = performance.now();
    let heardVoice = false;
    let lastVoiceAt = startedAt;

    const watchVolume = () => {
      const now = performance.now();
      analyser.getByteTimeDomainData(samples);
      const loudness =
        samples.reduce((total, sample) => total + Math.abs(sample - 128), 0) / samples.length;

      if (loudness > 4.5) {
        heardVoice = true;
        lastVoiceAt = now;
        setCaption("Keep going. I’m listening.");
      }

      if (heardVoice && now - startedAt > minimumListenMs && now - lastVoiceAt > listenSilenceMs) {
        stopRecorder();
        return;
      }

      if (now - startedAt > maxListenMs) {
        stopRecorder();
        return;
      }

      animationFrame = window.requestAnimationFrame(watchVolume);
    };

    animationFrame = window.requestAnimationFrame(watchVolume);
  }, [submitTranscript]);

  const startListening = useCallback(async () => {
    clearListeningTimers();
    didSubmitListeningRef.current = false;
    listeningTranscriptRef.current = "";
    setMode("listening");
    setCaption("I’m listening. Tell me your story idea.");
    setSpokenTranscript("");
    playCue("listen");

    if (navigator.mediaDevices && "MediaRecorder" in window) {
      await startMediaRecorderFallback();
      return;
    }

    const finishListening = (transcript: string) => {
      if (didSubmitListeningRef.current) return;
      didSubmitListeningRef.current = true;
      clearListeningTimers();
      try {
        recognitionRef.current?.stop();
      } catch {
        // Some browsers throw if recognition has already ended.
      }
      recognitionRef.current = null;
      void submitTranscript(transcript);
    };

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Recognition) {
      const recognition = new Recognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = parentSettings.speechLocale;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript)
          .join(" ");
        listeningTranscriptRef.current = transcript;
        setSpokenTranscript(transcript);
        setCaption(transcript ? "Keep going. I’m listening." : "I’m listening.");

        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = window.setTimeout(() => {
          finishListening(listeningTranscriptRef.current);
        }, listenSilenceMs);
      };
      recognition.onerror = () => {
        didSubmitListeningRef.current = true;
        playCue("error");
        setError("I couldn’t hear that. Tap Start and try again.");
        setMode("idle");
        setHasStarted(false);
        setIsGenerating(false);
        clearListeningTimers();
      };
      recognition.onend = () => {
        if (!didSubmitListeningRef.current) {
          const transcript = listeningTranscriptRef.current;
          if (!transcript.trim()) {
            silenceTimerRef.current = window.setTimeout(() => {
              finishListening(listeningTranscriptRef.current);
            }, minimumListenMs);
            return;
          }
          finishListening(transcript);
        }
      };
      maxListenTimerRef.current = window.setTimeout(() => {
        finishListening(listeningTranscriptRef.current);
      }, maxListenMs);
      recognition.start();
      return;
    }

  }, [clearListeningTimers, playCue, parentSettings.speechLocale, startMediaRecorderFallback, submitTranscript]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  useEffect(() => {
    return () => {
      storyRunRef.current += 1;
      isPausedRef.current = false;
      resumeWaitersRef.current.forEach((resolve) => resolve());
      resumeWaitersRef.current = [];
      stopCurrentPlayback();
      clearListeningTimers();
      clearAssetCaches();
      try {
        recognitionRef.current?.stop();
      } catch {
        // Some browsers throw if recognition has already ended.
      }
    };
  }, [clearAssetCaches, clearListeningTimers, stopCurrentPlayback]);

  const begin = useCallback(async () => {
    if (mode !== "idle" || hasStarted) return;
    storyRunRef.current += 1;
    const runId = storyRunRef.current;
    setStoryPaused(false);
    stopCurrentPlayback();
    clearAssetCaches();
    setStoryEnded(false);
    setSession(null);
    setCurrentScene(null);
    setActiveLine(null);
    setHasStarted(true);
    setIsGenerating(false);
    setError("");
    setSpokenTranscript("");
    playCue("start");
    setCaption(openingPrompt);
    setMode("speaking");
    await speakNarrator(openingPrompt);
    if (shouldStopStory(runId)) return;
    await startListening();
  }, [
    clearAssetCaches,
    hasStarted,
    mode,
    openingPrompt,
    playCue,
    setStoryPaused,
    shouldStopStory,
    speakNarrator,
    startListening,
    stopCurrentPlayback,
  ]);

  const togglePause = useCallback(() => {
    setStoryPaused(!isPausedRef.current);
  }, [setStoryPaused]);

  const quitToHome = useCallback(() => {
    storyRunRef.current += 1;
    setStoryPaused(false);
    stopCurrentPlayback();
    clearListeningTimers();
    try {
      recognitionRef.current?.stop();
    } catch {
      // Some browsers throw if recognition has already ended.
    }
    recognitionRef.current = null;
    didSubmitListeningRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setMode("idle");
    setHasStarted(false);
    setStoryEnded(false);
    setSession(null);
    setCurrentScene(null);
    setActiveLine(null);
    setSpokenTranscript("");
    setError("");
    setIsGenerating(false);
    setCaption("Press Start and tell me your story idea.");
  }, [clearListeningTimers, setStoryPaused, stopCurrentPlayback]);

  const sceneCount = session?.scenes.length || 12;
  const screenState = currentScene
    ? "reading"
    : hasStarted
      ? mode === "listening"
        ? "create"
        : "making"
      : "home";
  const showGeneratingScreen = isGenerating && !currentScene;
  return (
    <main
      className={
        currentScene
          ? "stage stage-reading"
          : hasStarted
            ? "stage stage-home stage-voice-center"
            : "stage stage-home"
      }
    >
      <section
        className={
          currentScene
            ? "storybook-page app-screen app-screen-reading"
            : showGeneratingScreen
              ? "storybook-page app-screen app-screen-generating"
              : "storybook-page app-screen"
        }
        aria-live="polite"
      >
        <span className="sky cloud cloud-one" />
        <span className="sky cloud cloud-two" />
        {!showGeneratingScreen ? (
          <>
            <span className="sky sparkle sparkle-one">+</span>
            <span className="sky sparkle sparkle-two">★</span>
          </>
        ) : null}
        {!currentScene && !showGeneratingScreen ? (
          <div className="fairy-forest" aria-hidden="true">
            <span className="fairy-tree fairy-tree-one" />
            <span className="fairy-tree fairy-tree-two" />
            <span className="fairy-tree fairy-tree-three" />
            <span className="fairy-tree fairy-tree-four" />
            <span className="fairy-firefly fairy-firefly-one" />
            <span className="fairy-firefly fairy-firefly-two" />
            <span className="fairy-firefly fairy-firefly-three" />
          </div>
        ) : null}
        <header className="app-topbar">
          <div className="brand-lockup" aria-label="Storypop">
            <StorypopLogo className="storypop-logo" />
          </div>
          <SettingsAvatarLink />
        </header>

        {currentScene ? (
          <div className="reader-screen">
            <div className="reader-titlebar">
              <div>
                <h1>{currentScene.title}</h1>
                <p>
                  Page <strong>{currentScene.sceneNumber}</strong> of {sceneCount}
                </p>
              </div>
            </div>

            {hasGeneratedStoryImageUrl(currentScene.imageUrl) ? (
              <div
                className="scene-art"
                style={{ backgroundImage: `url("${currentScene.imageUrl}")` }}
              />
            ) : (
              <div className="scene-art scene-art-waiting">
                <BookOpen size={110} strokeWidth={1.4} />
              </div>
            )}

            <div
              className={[
                "reader-copy speaker-card",
                activeSpeaker ? speakerCardClassByTrait[activeSpeaker.trait] : "speaker-card-narrator",
              ].join(" ")}
            >
              <div className="speaker-avatar" aria-hidden="true">
                <span className="speaker-emoji">
                  {emojiForSpeaker(
                    activeSpeaker?.speakerId || activeLine?.speakerId || "narrator",
                    activeSpeaker?.displayName || activeLine?.speakerName || "Narrator",
                    activeSpeaker?.trait || "narrator",
                  )}
                </span>
              </div>
              <div className="speaker-copy">
                <span className="speaker-name">{activeSpeaker?.displayName || activeLine?.speakerName || "Narrator"}</span>
              <p>{caption}</p>
              </div>
            </div>

            <div className="read-progress">
              <span />
              <div>
                <span style={{ width: `${Math.max(12, (currentScene.sceneNumber / sceneCount) * 100)}%` }} />
              </div>
              <strong>{mode === "speaking" ? "reading aloud" : "warming up"}</strong>
            </div>

            <div className="reader-controls">
              <div className="reader-action-group">
                <button
                  className="reader-play-toggle"
                  type="button"
                  onClick={togglePause}
                  aria-label={isPaused ? "Resume story" : "Pause story"}
                >
                  {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                  {isPaused ? "play" : "pause"}
                </button>
              </div>
            </div>
          </div>
        ) : showGeneratingScreen ? (
          <section className="minimal-loading" aria-label="Generating your story">
            <div className="loading-emojis" aria-hidden="true">
              <span>📖</span>
              <span>✨</span>
              <span>🎨</span>
            </div>
            <LoaderCircle className="loading-spinner" size={68} strokeWidth={2.2} />
            <h1>Making your book</h1>
            <p>{caption}</p>
          </section>
        ) : (
          <div className={`home-screen home-screen-${screenState}`}>
            {hasStarted ? (
              <section className="hero-copy">
                <p className="eyebrow">Storypop</p>
                <h1>
                  <>
                    what should
                    <br />
                    happen?
                  </>
                </h1>
                <p>Tell your idea out loud and we will turn it into a story.</p>
              </section>
            ) : null}

            {hasStarted ? (
              <section className="create-panel">
                <VoiceOrb mode={mode} />
                <p className="talk-hint">
                  <AudioLines size={24} />
                  {caption}
                </p>
                {spokenTranscript ? <span className="transcript-pill">You said: {spokenTranscript}</span> : null}
                {error ? <strong className="error-pill">{error}</strong> : null}
              </section>
            ) : (
              <section className="home-actions home-actions-simple">
                <button
                  className="start-button"
                  type="button"
                  onClick={() => void begin()}
                  aria-label={storyEnded ? "Start a new story" : "Start story"}
                >
                  <Mic size={58} />
                  Start
                </button>
                <Link className="library-button" href="/stories">
                  <BookOpen size={18} />
                  my books
                </Link>
                {error ? <strong className="error-pill">{error}</strong> : null}
              </section>
            )}
          </div>
        )}

        {shareUrl ? (
          <nav className="bottom-nav" aria-label="Primary">
            <button
              className={screenState === "home" ? "active" : ""}
              type="button"
              onClick={quitToHome}
              aria-label="Quit story and return home"
            >
              <Home size={27} fill="currentColor" />
              home
            </button>
            <a className={screenState === "reading" ? "active" : ""} href={shareUrl}>
              <BookOpen size={27} fill="currentColor" />
              storybook
            </a>
          </nav>
        ) : null}
      </section>

    </main>
  );
}
