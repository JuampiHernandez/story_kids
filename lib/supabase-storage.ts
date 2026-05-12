import { createClient } from "@supabase/supabase-js";
import type { StorySession } from "./story-schema";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('Supabase credentials missing for storage');
    return null;
  }

  return createClient(url, anonKey);
}

// Storage bucket names
const BUCKETS = {
  STORY_IMAGES: 'story-images',
  STORY_AUDIO: 'story-audio',
  ASSETS: 'assets'
} as const;

/**
 * Upload an image to Supabase Storage
 * @param imageBlob - The image blob to upload
 * @param storyId - Story ID for organization
 * @param sceneIndex - Scene index for file naming
 * @returns Public URL of the uploaded image
 */
export async function uploadStoryImage(
  imageBlob: Blob, 
  storyId: string, 
  sceneIndex: number
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const fileName = `${storyId}/scene-${sceneIndex}.png`;
    
    const { data, error } = await supabase.storage
      .from(BUCKETS.STORY_IMAGES)
      .upload(fileName, imageBlob, {
        cacheControl: '3600',
        upsert: true, // Replace if exists
        contentType: 'image/png'
      });

    if (error) {
      console.error('Failed to upload story image:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKETS.STORY_IMAGES)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading story image:', error);
    return null;
  }
}

/**
 * Upload audio to Supabase Storage
 * @param audioBlob - The audio blob to upload
 * @param storyId - Story ID for organization
 * @param lineIndex - Line index for file naming
 * @param speakerId - Speaker ID for file naming
 * @returns Public URL of the uploaded audio
 */
export async function uploadStoryAudio(
  audioBlob: Blob,
  storyId: string,
  lineIndex: number,
  speakerId: string
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const fileName = `${storyId}/line-${lineIndex}-${speakerId}.mp3`;
    
    const { data, error } = await supabase.storage
      .from(BUCKETS.STORY_AUDIO)
      .upload(fileName, audioBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'audio/mpeg'
      });

    if (error) {
      console.error('Failed to upload story audio:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKETS.STORY_AUDIO)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading story audio:', error);
    return null;
  }
}

/**
 * Convert a data URL to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, data] = dataUrl.split(',');
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: mime });
  } catch (error) {
    console.error('Failed to convert data URL to blob:', error);
    return null;
  }
}

/**
 * Upload story images from data URLs to Supabase Storage
 * Updates the story session with new URLs
 */
export async function uploadStoryImages(session: StorySession): Promise<StorySession> {
  const updatedScenes = await Promise.all(
    session.scenes.map(async (scene, index) => {
      // Skip if already uploaded to Supabase (not a data URL)
      if (!scene.imageUrl || !scene.imageUrl.startsWith('data:')) {
        return scene;
      }

      const imageBlob = dataUrlToBlob(scene.imageUrl);
      if (!imageBlob) {
        console.warn(`Failed to convert scene ${index} image to blob`);
        return scene;
      }

      const uploadedUrl = await uploadStoryImage(imageBlob, session.id, index);
      if (!uploadedUrl) {
        console.warn(`Failed to upload scene ${index} image`);
        return scene;
      }

      console.log(`Uploaded scene ${index} image to:`, uploadedUrl);
      return {
        ...scene,
        imageUrl: uploadedUrl
      };
    })
  );

  return {
    ...session,
    scenes: updatedScenes
  };
}

/**
 * Create storage buckets if they don't exist
 * This should be run once during setup
 */
export async function createStorageBuckets() {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    // Check existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Failed to list buckets:', listError);
      return;
    }

    const existingBuckets = new Set(buckets?.map(b => b.name) || []);

    // Create missing buckets
    for (const [bucketKey, bucketName] of Object.entries(BUCKETS)) {
      if (!existingBuckets.has(bucketName)) {
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: bucketName === BUCKETS.STORY_IMAGES 
            ? ['image/png', 'image/jpeg', 'image/webp']
            : ['audio/mpeg', 'audio/wav', 'audio/ogg'],
          fileSizeLimit: bucketName === BUCKETS.STORY_IMAGES ? 5 * 1024 * 1024 : 10 * 1024 * 1024 // 5MB for images, 10MB for audio
        });

        if (error) {
          console.error(`Failed to create bucket ${bucketName}:`, error);
        } else {
          console.log(`Created storage bucket: ${bucketName}`);
        }
      }
    }
  } catch (error) {
    console.error('Error creating storage buckets:', error);
  }
}

/**
 * Delete all files associated with a story
 */
export async function deleteStoryAssets(storyId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    // Delete images
    const { error: imageError } = await supabase.storage
      .from(BUCKETS.STORY_IMAGES)
      .remove([`${storyId}/`]);

    if (imageError) {
      console.error('Failed to delete story images:', imageError);
    }

    // Delete audio
    const { error: audioError } = await supabase.storage
      .from(BUCKETS.STORY_AUDIO)
      .remove([`${storyId}/`]);

    if (audioError) {
      console.error('Failed to delete story audio:', audioError);
    }
  } catch (error) {
    console.error('Error deleting story assets:', error);
  }
}