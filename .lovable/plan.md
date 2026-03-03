

## Plan: Streamlined News Creation System

### Problem
Writing full news articles is too time-consuming for a solo operator. You need faster ways to publish content.

### What to Build

**1. Quick-Post Templates (in Admin)**
Add pre-built category templates to the admin news creation form. When you click "New", you pick a template (Patch Notes, Event Recap, Dev Update, Community Spotlight) and get a pre-filled structure with placeholder text you just fill in. This alone cuts writing time to under 2 minutes.

**2. AI-Assisted Draft Generation (in Admin)**
Add a "Generate with AI" button to the news article creation form. You provide a few bullet points or a short description, and AI generates a full draft (title, excerpt, markdown content). You review, tweak, and publish. Uses Lovable AI (already available) via a backend function.

**3. Curate from URL (in Admin)**
Add a "Import from URL" option. Paste a link to patch notes, a dev blog, or a tweet. The system fetches the page content and uses AI to summarize it into a news article draft. Uses Firecrawl for scraping + Lovable AI for summarization.

### Implementation Details

**Backend function: `supabase/functions/generate-news/index.ts`**
- Accepts either `{ prompt, category }` (AI-assisted) or `{ url, category }` (curate from URL)
- For URL mode: calls Firecrawl to scrape, then passes content to Lovable AI
- For prompt mode: sends bullet points directly to Lovable AI
- Returns `{ title, slug, excerpt, content }` as a draft
- Uses LOVABLE_API_KEY (already configured)

**Frontend changes: `src/pages/admin/AdminNews.tsx`**
- Add a pre-creation dialog with three options: "Blank", "From Template", "AI Generate", "Import URL"
- Templates: hardcoded markdown skeletons per category
- AI Generate: text area for bullet points → calls edge function → pre-fills form
- Import URL: URL input → calls edge function → pre-fills form
- All options land in the existing create/edit form for final review before saving

**Firecrawl connector**
- Needed for the "Import from URL" feature
- Will prompt you to connect Firecrawl when implementing

### Files to Create/Edit
- `supabase/functions/generate-news/index.ts` — new edge function
- `src/pages/admin/AdminNews.tsx` — add template picker, AI generate, URL import UI
- `supabase/config.toml` — register the new function (auto-handled)

### User Flow
1. Click "New" on News Articles admin page
2. Choose: Template / AI Generate / Import URL / Blank
3. Form pre-fills with draft content
4. Review, edit, publish

