"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Pause, Play, Square } from "lucide-react";
import type { StorySession } from "@/lib/story-schema";

type PlayerState = "idle" | "loading" | "playing" | "paused";

type StoryAudioPlayerProps = {
  session: StorySession;
};

export function StoryAudioPlayer({ session }: StoryAudioPlayerProps) {
  const [state, setState] = useState<PlayerState>("idle");
  const [nowPlaying, setNowPlaying] = useState("Ready to play this story aloud.");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const runRef = useRef(0);
  const audioCacheRef = useRef(new Map<string, string>());

  const fetchLineAudio = useCallback(
    async (sceneIndex: number, lineIndex: number) => {
      const scene = session.scenes[sceneIndex];
      const line = scene.lines[lineIndex];
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
    audioRef.current?.pause();
    audioRef.current = null;
    setState("idle");
    setNowPlaying("Ready to play this story aloud.");
  }, []);

  const play = useCallback(async () => {
    if (state === "paused") {
      setState("playing");
      void audioRef.current?.play();
      return;
    }

    const runId = runRef.current + 1;
    runRef.current = runId;

    try {
      setState("loading");
      for (let sceneIndex = 0; sceneIndex < session.scenes.length; sceneIndex += 1) {
        const scene = session.scenes[sceneIndex];

        for (let lineIndex = 0; lineIndex < scene.lines.length; lineIndex += 1) {
          if (runRef.current !== runId) return;
          const line = scene.lines[lineIndex];
          setNowPlaying(`${line.speakerName}: ${line.text}`);

          const url = await fetchLineAudio(sceneIndex, lineIndex);
          if (runRef.current !== runId) return;
          if (!url) continue;

          setState("playing");
          await playAudioUrl(url);
        }
      }

      if (runRef.current === runId) stop();
    } catch (error) {
      console.error("Story replay failed", error);
      stop();
    }
  }, [fetchLineAudio, playAudioUrl, session.scenes, state, stop]);

  const pause = useCallback(() => {
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
      <p>{nowPlaying}</p>
    </section>
  );
}
