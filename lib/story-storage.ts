import type { StorySession } from "@/lib/story-schema";

const BROWSER_STORAGE_KEY = "storypop_stories";

// Browser-side storage functions (client-side only)
export function saveStoryToBrowser(story: StorySession) {
  if (typeof window === 'undefined') return;
  
  try {
    const existingStories = getStoriesFromBrowser();
    const updatedStories = existingStories.filter(s => s.id !== story.id);
    updatedStories.push(story);
    
    // Keep only the last 20 stories to avoid storage bloat
    const trimmedStories = updatedStories
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 20);
    
    localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(trimmedStories));
    console.log('Story saved to browser storage:', story.id);
  } catch (error) {
    console.error('Failed to save story to browser storage:', error);
  }
}

export function getStoriesFromBrowser(): StorySession[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(BROWSER_STORAGE_KEY);
    if (!stored) return [];
    
    const stories = JSON.parse(stored) as StorySession[];
    console.log('Loaded', stories.length, 'stories from browser storage');
    return stories;
  } catch (error) {
    console.error('Failed to load stories from browser storage:', error);
    return [];
  }
}

export function removeStoryFromBrowser(storyId: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const existingStories = getStoriesFromBrowser();
    const filteredStories = existingStories.filter(s => s.id !== storyId);
    localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(filteredStories));
  } catch (error) {
    console.error('Failed to remove story from browser storage:', error);
  }
}

export function clearBrowserStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(BROWSER_STORAGE_KEY);
    console.log('Browser storage cleared');
  } catch (error) {
    console.error('Failed to clear browser storage:', error);
  }
}