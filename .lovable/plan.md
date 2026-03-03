

## Plan: Admin Analytics Dashboard + Sidebar Reorganization

### Sidebar Changes (`src/pages/admin/AdminLayout.tsx`)

Split the flat nav list into two groups:

**Content** — Heroes, Items, Skills, Materials, News, Guides, Official Posts, Changelog, Roadmap

**Insights** — Analytics (new), Feedback (existing)

Use two `SidebarGroup` blocks with separate `SidebarGroupLabel`s.

### New Analytics Page (`src/pages/admin/AdminAnalytics.tsx`)

A dashboard with 4 stat cards in a grid:

1. **Active Users (Real-time)** — Use the Supabase analytics query tool to check if presence/realtime stats are available. Since there's no built-in real-time user count without extra infrastructure, this card will show a "Coming Soon" placeholder or use a simple approach: query distinct feedback submitters in the last 15 minutes as a proxy. More practically, display this as a placeholder card labeled "Real-time visitors" with a note that it requires additional tracking setup.

2. **Visitors (28 days)** — Same limitation: no visitor tracking table exists. This will be a placeholder card suggesting integration with an analytics provider, or we can count unique `page_url` feedback entries as a rough proxy. Better approach: show it as a placeholder.

3. **Average Feedback Rating** — Query `feedback` table, compute `AVG(rating)`. Straightforward.

4. **Feedback Count** — Query `feedback` table `COUNT(*)`. Straightforward.

**Realistic approach**: Cards 1 and 2 (active users, visitor count) require client-side analytics tracking that doesn't exist yet. Rather than building a full analytics pipeline, I'll:
- Create a simple `page_views` table to track page visits (inserted client-side on each navigation)
- Use that for "visitors last 28 days" (count distinct sessions or rows)
- For "real-time active users", count page_views in the last 5 minutes
- Feedback stats come directly from the `feedback` table

### Database Migration

Create `page_views` table:
- `id` (uuid, PK)
- `page_url` (text)
- `session_id` (text) — random ID stored in sessionStorage to deduplicate
- `created_at` (timestamptz)

RLS: Allow anonymous inserts. Admin-only select. No update/delete.

### Page View Tracker (`src/hooks/usePageView.tsx`)

A hook used in the main `App.tsx` that inserts a row into `page_views` on each route change. Uses a `sessionStorage` session ID to enable distinct visitor counting.

### Route Registration (`src/App.tsx`)

Add `/admin/analytics` route pointing to the new page.

### Files to create/edit
- **Migration** — `page_views` table + RLS
- `src/hooks/usePageView.tsx` — new hook for tracking
- `src/pages/admin/AdminAnalytics.tsx` — new dashboard page
- `src/pages/admin/AdminLayout.tsx` — reorganize sidebar into Content + Insights groups
- `src/App.tsx` — add route + page view hook

