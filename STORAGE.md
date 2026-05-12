# Supabase Storage Integration

This app now uses Supabase Storage for persistent storage of all story assets including images, audio, and metadata.

## Architecture

### Storage Layers

1. **Supabase Database** (Primary) - Story metadata and references
2. **Supabase Storage** (Primary) - Images and audio files
3. **Server Memory** (Cache) - Fast access during development
4. **Browser LocalStorage** (Backup) - Client-side persistence

### Storage Buckets

- `story-images`: Generated story scene images (PNG/JPEG)
- `story-audio`: Pre-generated narration audio (MP3)
- `assets`: Other story-related files

## Setup Instructions

### 1. Initialize Storage Buckets

Visit `/settings` and click "Setup Supabase Storage" or call the API directly:

```bash
curl -X POST http://localhost:3000/api/setup-storage
```

### 2. Environment Variables

Ensure these are set in your `.env` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### 3. Database Schema

The `toddler_tales_stories` table should already exist. No changes needed to the database schema.

## How It Works

### Story Creation Flow

1. User creates a story via voice input
2. **Text Generation**: OpenAI generates story content
3. **Image Generation**: DALL-E generates images → stored as data URLs initially
4. **Image Upload**: Data URLs converted to blobs → uploaded to Supabase Storage
5. **Audio Generation**: ElevenLabs generates audio → uploaded to Supabase Storage
6. **Database Save**: Story metadata saved to Supabase with asset URLs

### Story Playback Flow

1. Story loads from database with asset URLs
2. **Images**: Loaded directly from Supabase Storage URLs
3. **Audio**: Pre-generated audio loaded from Supabase Storage
4. **Fallback**: If assets missing, generate on-demand

### File Organization

```
story-images/
├── {story-id}/
│   ├── scene-0.png
│   ├── scene-1.png
│   └── scene-N.png

story-audio/
├── {story-id}/
│   ├── line-0-narrator.mp3
│   ├── line-1-hero.mp3
│   └── line-N-{speaker}.mp3
```

## API Endpoints

### Image Generation
- `POST /api/story/image` - Generate and upload scene images
- Automatically uploads to Supabase Storage

### Audio Generation
- `POST /api/story/audio` - Pre-generate all audio for a story
- Parameters: `{ sessionId: string, regenerate?: boolean }`

### Storage Setup
- `POST /api/setup-storage` - Initialize storage buckets

## Benefits

1. **Persistent Storage**: Stories survive server restarts
2. **Fast Loading**: Pre-generated assets load instantly
3. **Scalability**: Supabase Storage handles CDN distribution
4. **Backup System**: Multiple storage layers prevent data loss
5. **Cost Effective**: Only generate assets once

## Migration

Existing stories will be automatically migrated:
- Old data URLs converted to Supabase Storage URLs
- Browser storage updated with new schema
- Fallback generation for missing assets

## Troubleshooting

### Storage Issues
1. Check Supabase credentials in `.env`
2. Verify storage buckets exist (run setup)
3. Check browser console for upload errors

### Audio Issues
1. Verify ElevenLabs API key
2. Check rate limits (max 3 concurrent requests)
3. Ensure proper voice IDs in voice cast

### Image Issues
1. Check OpenAI API key and credits
2. Verify image upload permissions
3. Check data URL to blob conversion

## Development

### Testing Storage
```bash
# Create a test story and check uploads
npm run dev
# Create story via UI
# Check Supabase Storage dashboard for files
```

### Clearing Storage
```bash
# Clear browser storage
localStorage.removeItem('storypop_stories');

# Clear server memory (restart dev server)
# Supabase data persists
```