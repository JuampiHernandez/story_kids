"use client";

import { useState } from "react";
import { Volume2, Loader2 } from "lucide-react";
import type { StorySession } from "@/lib/story-schema";

interface AudioGeneratorButtonProps {
  storyId: string;
  /** Passed when the story may not be in server memory (serverless) */
  session?: StorySession;
  onComplete?: () => void;
}

export function AudioGeneratorButton({ storyId, session, onComplete }: AudioGeneratorButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>("");

  const generateAudio = async () => {
    setIsGenerating(true);
    setStatus("Generating audio files...");

    try {
      const response = await fetch("/api/story/audio", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: storyId,
          regenerate: false,
          ...(session ? { session } : {}),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus(`✓ Generated ${result.audioCount} audio files`);
        onComplete?.();
      } else {
        setStatus(`✗ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Audio generation failed:", error);
      setStatus("✗ Audio generation failed");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  return (
    <div className="audio-generator">
      <button
        onClick={generateAudio}
        disabled={isGenerating}
        className="audio-gen-button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: isGenerating ? '#f0f0f0' : '#007bff',
          color: isGenerating ? '#666' : 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          fontSize: '14px',
        }}
      >
        {isGenerating ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Volume2 size={16} />
        )}
        {isGenerating ? "Generating..." : "Pre-generate Audio"}
      </button>
      {status && (
        <p style={{ 
          margin: '4px 0 0 0', 
          fontSize: '12px', 
          color: status.startsWith('✓') ? 'green' : status.startsWith('✗') ? 'red' : '#666'
        }}>
          {status}
        </p>
      )}
    </div>
  );
}