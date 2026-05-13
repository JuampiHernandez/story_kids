"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Pause, Play, Square } from "lucide-react";
import type { NarrationLine, StorySession } from "@/lib/story-schema";

type PlayerState = "idle" | "loading" | "playing" | "paused";

type StoryAudioPlayerProps = {
  session: StorySession;
  onSceneChange?: (sceneId: string | null) => void;
  onLineChange?: (line: { sceneId: string; lineIndex: number; line: NarrationLine } | null) => void;
  onPlaybackChange?: (isReplaying: boolean) => void;
};

export function StoryAudioPlayer({
  session,
  onSceneChange,
  onLineChange,
  onPlaybackChange,
}: StoryAudioPlayerProps) {
  const [state, setState] = useState<PlayerState>("idle");
  const [nowPlaying, setNowPlaying] = useState("Ready to play this story aloud.");
  const [currentSceneNumber, setCurrentSceneNumber] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const runRef = useRef(0);
  const audioCacheRef = useRef(new Map<string, string>());
  const isPausedRef = useRef(false);

  const fetchLineAudio = useCallback(
    async (sceneIndex: number, lineIndex: number) => {
      const scene = session.scenes[sceneIndex];
      const line = scene.lines[lineIndex];
      
      // If the line already has a stored audio URL, use it directly
      if (line.audioUrl) {
        return line.audioUrl;
      }

      // Fallback to generating audio on-demand using the TTS API
      const cacheKey = `${scene.id}:${lineIndex}`;
      const cachedUrl = audioCacheRef.current.get(cacheKey);
      if (cachedUrl) return cachedUrl;

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: line.text,
          speakerId: line.speakerId,
          sessionId: session.id,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("audio")) return null;

      const url = URL.createObjectURL(await response.blob());
      audioCacheRef.current.set(cacheKey, url);
      return url;
    },
    [session],
  );

  const playAudioUrl = useCallback((url: string) => {
    const audio = new Audio(url);
    audioRef.current = audio;

    return new Promise<void>((resolve) => {
      const finish = () => {
        if (audioRef.current === audio) audioRef.current = null;
        resolve();
      };

      audio.onended = finish;
      audio.onerror = finish;
      void audio.play();
    });
  }, []);

  const stop = useCallback(() => {
    runRef.current += 1;
    isPausedRef.current = false;
    audioRef.current?.pause();
    audioRef.current = null;
    setState("idle");
    setNowPlaying("Ready to play this story aloud.");
    setCurrentSceneNumber(null);
    onSceneChange?.(null);
    onLineChange?.(null);
    onPlaybackChange?.(false);
  }, [onLineChange, onPlaybackChange, onSceneChange]);

  const waitUntilResumed = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (!isPausedRef.current) {
        resolve();
        return;
      }

      const checkResumed = () => {
        if (!isPausedRef.current) {
          resolve();
        } else {
          setTimeout(checkResumed, 100);
        }
      };
      checkResumed();
    });
  }, []);

  const pausableDelay = useCallback(async (ms: number, runId: number) => {
    const startTime = Date.now();
    while (Date.now() - startTime < ms) {
      if (runRef.current !== runId) return;
      await waitUntilResumed();
      if (runRef.current !== runId) return;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(100, ms - (Date.now() - startTime))),
      );
    }
  }, [waitUntilResumed]);

  const play = useCallback(async () => {
    if (state === "paused") {
      isPausedRef.current = false;
      setState("playing");
      onPlaybackChange?.(true);
      void audioRef.current?.play();
      return;
    }

    const runId = runRef.current + 1;
    runRef.current = runId;
    isPausedRef.current = false;

    try {
      setState("loading");
      onPlaybackChange?.(true);
      
      for (let sceneIndex = 0; sceneIndex < session.scenes.length; sceneIndex += 1) {
        const scene = session.scenes[sceneIndex];
        let previousSpeakerId: string | null = null;

        // Notify about scene change
        onSceneChange?.(scene.id);
        onLineChange?.(null);
        setCurrentSceneNumber(scene.sceneNumber);

        // Add a longer pause between scenes
        if (sceneIndex > 0) {
          if (runRef.current !== runId) return;
          await pausableDelay(800, runId);
          if (runRef.current !== runId) return;
        }

        for (let lineIndex = 0; lineIndex < scene.lines.length; lineIndex += 1) {
          if (runRef.current !== runId) return;
          await waitUntilResumed();
          if (runRef.current !== runId) return;
          
          const line = scene.lines[lineIndex];
          onLineChange?.({ sceneId: scene.id, lineIndex, line });
          
          // Add pause between different speakers to improve pacing
          if (previousSpeakerId !== null && previousSpeakerId !== line.speakerId) {
            await pausableDelay(600, runId);
            if (runRef.current !== runId) return;
          }
          
          setNowPlaying(`${line.speakerName}: ${line.text}`);

          const url = await fetchLineAudio(sceneIndex, lineIndex);
          if (runRef.current !== runId) return;
          await waitUntilResumed();
          if (runRef.current !== runId) return;
          
          if (!url) {
            // Add a small pause even for failed audio
            await pausableDelay(300, runId);
            previousSpeakerId = line.speakerId;
            continue;
          }

          setState("playing");
          await playAudioUrl(url);
          
          // Add a small pause after each line for better pacing
          await pausableDelay(200, runId);
          if (runRef.current !== runId) return;
          
          previousSpeakerId = line.speakerId;
        }
      }

      if (runRef.current === runId) stop();
    } catch (error) {
      console.error("Story replay failed", error);
      stop();
    }
  }, [
    fetchLineAudio,
    onLineChange,
    onPlaybackChange,
    onSceneChange,
    playAudioUrl,
    session.scenes,
    state,
    stop,
    pausableDelay,
    waitUntilResumed,
  ]);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    audioRef.current?.pause();
    setState("paused");
  }, []);

  useEffect(() => {
    const audioCache = audioCacheRef.current;

    return () => {
      runRef.current += 1;
      audioRef.current?.pause();
      audioCache.forEach((url) => URL.revokeObjectURL(url));
      audioCache.clear();
    };
  }, []);

  return (
    <section className="story-audio-player" aria-label="Story audio player">
      <button
        type="button"
        onClick={state === "playing" ? pause : () => void play()}
        disabled={state === "loading"}
      >
        {state === "loading" ? (
          <LoaderCircle className="loading-spinner" size={22} />
        ) : state === "playing" ? (
          <Pause size={22} fill="currentColor" />
        ) : (
          <Play size={22} fill="currentColor" />
        )}
        {state === "loading" ? "loading audio" : state === "playing" ? "pause audio" : "play audio"}
      </button>
      {state !== "idle" ? (
        <button type="button" onClick={stop}>
          <Square size={18} fill="currentColor" />
          stop
        </button>
      ) : null}
      <div className="story-player-status">
        {currentSceneNumber && (
          <div className="scene-indicator">
            Page {currentSceneNumber} of {session.scenes.length}
          </div>
        )}
        <p>{nowPlaying}</p>
      </div>
    </section>
  );
}
