# Toddler Tales

Toddler Tales is a voice-first, illustrated AI storybook for the ElevenLabs + Cursor ElevenHacks hackathon. The child-facing app is designed to run without a keyboard: tap once, speak a story idea, hear multi-character narration, choose branches out loud, and end with a saved illustrated storybook.

## V1 Scope

- 4-minute stories with 4 generated scenes.
- OpenAI `gpt-image-1` low-quality images for the first version.
- ElevenLabs streaming TTS for narrator and character voices.
- ElevenLabs STT upload route, with browser speech recognition fallback for fast local demos.
- Supabase persistence when credentials are present, with in-memory demo persistence otherwise.
- Parent share page at `/story/[id]`.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Fill in `.env` with:

- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- ElevenLabs voice IDs, or use the default public demo IDs while prototyping
- Supabase keys if you want saved stories to persist across server restarts

Apply `supabase/schema.sql` in your Supabase SQL editor to create the story table.

## Demo Script

1. Open the app fullscreen on a tablet or laptop.
2. Tap anywhere.
3. When asked what the story should be about, say: “A dragon who lost his shoe.”
4. Let the first illustrated page appear while the narrator speaks.
5. When offered choices, answer out loud: “Follow the sparkle trail.”
6. Repeat until the storybook link appears.
7. Open the saved storybook page for the share/print ending shot.

## Viral Video Beats

- Start with the no-keyboard constraint: kid taps once, then only talks.
- Show the animated mic changing states while the AI listens and speaks.
- Cut quickly from child prompt to new illustration reveal.
- Highlight multiple voices by letting the narrator and dragon speak back-to-back.
- End on the parent storybook page as the “share with grandparents” payoff.
