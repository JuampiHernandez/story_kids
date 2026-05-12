import { uploadStoryAudio } from "./supabase-storage";
import type { NarrationLine, VoiceCastMember } from "./story-schema";

/**
 * Generate and upload audio to Supabase Storage using ElevenLabs
 */
export async function generateAndUploadAudio(
  line: NarrationLine,
  voiceCast: VoiceCastMember[],
  storyId: string,
  lineIndex: number
): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn('ElevenLabs API key not available');
    return null;
  }

  try {
    // Find the voice for this speaker
    const speaker = voiceCast.find(member => member.speakerId === line.speakerId);
    if (!speaker?.voiceId) {
      console.warn(`No voice ID found for speaker: ${line.speakerId}`);
      return null;
    }

    // Generate audio using ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${speaker.voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: line.text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      console.error('ElevenLabs API error:', response.status, response.statusText);
      return null;
    }

    const audioBlob = await response.blob();
    
    // Upload to Supabase Storage
    const uploadedUrl = await uploadStoryAudio(audioBlob, storyId, lineIndex, line.speakerId);
    if (!uploadedUrl) {
      console.warn('Failed to upload audio to Supabase');
      return null;
    }

    console.log(`Audio uploaded to Supabase Storage: ${uploadedUrl}`);
    return uploadedUrl;
  } catch (error) {
    console.error('Error generating and uploading audio:', error);
    return null;
  }
}

/**
 * Pre-generate and upload all audio for a story
 */
export async function preGenerateStoryAudio(
  storyId: string,
  lines: NarrationLine[],
  voiceCast: VoiceCastMember[]
): Promise<{ [lineIndex: number]: string }> {
  const audioUrls: { [lineIndex: number]: string } = {};
  
  console.log(`Pre-generating audio for ${lines.length} lines...`);
  
  // Generate audio for each line in parallel (but limit concurrency)
  const BATCH_SIZE = 3; // Process 3 audio files at a time to avoid rate limits
  
  for (let i = 0; i < lines.length; i += BATCH_SIZE) {
    const batch = lines.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (line, batchIndex) => {
      const lineIndex = i + batchIndex;
      const audioUrl = await generateAndUploadAudio(line, voiceCast, storyId, lineIndex);
      if (audioUrl) {
        audioUrls[lineIndex] = audioUrl;
      }
    });
    
    await Promise.all(batchPromises);
    
    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < lines.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`Generated ${Object.keys(audioUrls).length} audio files`);
  return audioUrls;
}