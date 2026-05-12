import type { StorySession, NarrationLine } from "./story-schema";

/**
 * Migrate old story sessions to include audioUrl field
 */
export function migrateStorySession(session: StorySession): StorySession {
  const migratedScenes = session.scenes.map(scene => ({
    ...scene,
    lines: scene.lines.map(line => ({
      ...line,
      audioUrl: (line as any).audioUrl || undefined, // Add audioUrl if not present
    } as NarrationLine))
  }));

  return {
    ...session,
    scenes: migratedScenes
  };
}

/**
 * Check if a story session needs migration
 */
export function needsMigration(session: StorySession): boolean {
  return session.scenes.some(scene => 
    scene.lines.some(line => 
      !('audioUrl' in line)
    )
  );
}

/**
 * Migrate all stories in browser storage
 */
export function migrateBrowserStorageStories(): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem('storypop_stories');
    if (!stored) return;

    const stories = JSON.parse(stored) as StorySession[];
    let needsUpdate = false;

    const migratedStories = stories.map(story => {
      if (needsMigration(story)) {
        needsUpdate = true;
        return migrateStorySession(story);
      }
      return story;
    });

    if (needsUpdate) {
      localStorage.setItem('storypop_stories', JSON.stringify(migratedStories));
      console.log('Migrated browser storage stories to new schema');
    }
  } catch (error) {
    console.error('Failed to migrate browser storage stories:', error);
  }
}