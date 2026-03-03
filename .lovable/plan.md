

## Plan: AI Generate from Video URL

### Approach

YouTube pages are JavaScript-heavy and Firecrawl scraping often returns minimal useful content from them. Instead, we'll use Gemini's native multimodal capability — pass the YouTube URL directly to Gemini, which can process video content and generate an article from it.

### Changes

**1. Edge function (`supabase/functions/generate-news/index.ts`)**

Add a new `videoUrl` parameter. When provided:
- Skip Firecrawl entirely
- Extract the YouTube video ID from the URL
- Pass the video URL to Gemini as a `file_url` part in the user message (Gemini supports YouTube URLs natively)
- Use a video-specific system prompt that instructs the AI to watch/analyze the video and write an article summarizing it

The request body to Gemini will use the multimodal message format:
```json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "Analyze this video and write an article based on its content." },
    { "type": "file", "file": { "url": "https://www.youtube.com/watch?v=..." } }
  ]
}
```

**2. Frontend (`src/pages/admin/AdminNews.tsx`)**

- Add a 5th option in the creation mode picker: "From Video" with a `Video` icon
- Add a new `"video"` mode with a dialog containing:
  - Category selector (same as other modes)
  - YouTube URL input field
  - Optional notes/context textarea (to guide the AI on what to focus on)
  - "Generate from Video" button
- Wire it to call `generate-news` with `{ videoUrl, category, prompt }` (prompt = optional context notes)

### Files to edit
- `supabase/functions/generate-news/index.ts` — add `videoUrl` handling with Gemini multimodal
- `src/pages/admin/AdminNews.tsx` — add video mode to picker and dialog

