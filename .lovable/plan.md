

## Feedback Widget

### What to build

A minimal, fixed-position feedback widget in the bottom-right corner of every public page. Design concept:

**Collapsed state**: A small pill/button showing a chat-bubble icon + "Feedback" label, sitting unobtrusively at the bottom-right. Semi-transparent, becomes solid on hover.

**Expanded state** (on click): A compact card (~280px wide) with:
1. **Emoji reaction row** — 5 emoji buttons (😡 😕 😐 🙂 😍) for instant sentiment. One tap = done.
2. **Optional text field** — appears after selecting an emoji: "Anything else?" with a small textarea (2 rows) and a "Send" button.
3. **Thank you state** — replaces the form briefly after submit, then auto-collapses after 2s.

This is the lowest-friction pattern: one click to open, one click to rate, optionally type more. No login required.

### Database

Create a `feedback` table to store submissions:
- `id` (uuid, PK)
- `rating` (int, 1–5, the emoji index)
- `message` (text, nullable)
- `page_url` (text, the current route)
- `created_at` (timestamptz)

RLS: Allow anonymous inserts (public-facing, no auth required). No select/update/delete for anon — only admins can read feedback.

### Files

1. **Migration** — Create `feedback` table + RLS policies (anon insert, admin select).
2. **`src/components/FeedbackWidget.tsx`** — New component with collapsed/expanded/thank-you states, calls `supabase.from("feedback").insert(...)`.
3. **`src/App.tsx`** — Render `<FeedbackWidget />` at the app root level (outside Routes) so it appears on every page. Exclude admin routes.

### Design details
- Uses existing design tokens (card bg, border, primary gold, muted text).
- `position: fixed; bottom: 1rem; right: 1rem; z-index: 50`.
- Smooth scale/opacity transition on open/close.
- On admin pages, the widget is hidden.

