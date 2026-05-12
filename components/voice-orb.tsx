"use client";

import { clsx } from "clsx";
import { LoaderCircle, Mic } from "lucide-react";

type VoiceOrbProps = {
  mode: "idle" | "listening" | "thinking" | "speaking" | "painting";
  compact?: boolean;
};

export function VoiceOrb({ mode, compact = false }: VoiceOrbProps) {
  const hasAnimatedAudioBars = mode === "speaking" || mode === "listening";
  const Icon = mode === "thinking" || mode === "painting" ? LoaderCircle : Mic;

  return (
    <div className={clsx("orb-wrap", compact && "orb-wrap-compact")} aria-label={`Voice state: ${mode}`}>
      <div className={clsx("voice-orb", `voice-orb-${mode}`)}>
        <span className="voice-wave voice-wave-one" />
        <span className="voice-wave voice-wave-two" />
        <span className="voice-wave voice-wave-three" />
        {!hasAnimatedAudioBars ? <Icon size={54} strokeWidth={1.8} /> : null}
      </div>
      <p className="orb-caption">
        {mode === "idle" && "Ready"}
        {mode === "listening" && "Listening to you"}
        {mode === "thinking" && "Making your book"}
        {mode === "speaking" && "AI is talking"}
        {mode === "painting" && "Drawing pages"}
      </p>
    </div>
  );
}
