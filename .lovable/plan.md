

## Team Builder Tool — Implementation Plan

### Overview
Build a Team Builder tool at `/tools/team-builder` where authenticated users can create, save, and manage team compositions. Each team has a title, 5 hero slots (slot 1 is leader), and per-hero equipment (weapon, imprint, up to 3 armor sets). Includes markdown strategy notes with entity markup support.

### 1. Database Schema

**New table: `teams`**
- `id` uuid PK
- `user_id` uuid NOT NULL (references auth.users)
- `title` text NOT NULL
- `notes` text (markdown content)
- `created_at`, `updated_at` timestamps

**New table: `team_slots`**
- `id` uuid PK
- `team_id` uuid NOT NULL (FK → teams)
- `slot_number` integer NOT NULL (1-5)
- `hero_id` uuid (FK → heroes)
- `weapon_id` uuid (FK → weapons)
- `imprint_id` uuid (FK → imprints)
- `armor_set_1_id` uuid (FK → armor_sets)
- `armor_set_2_id` uuid (FK → armor_sets)
- `armor_set_3_id` uuid (FK → armor_sets)
- UNIQUE constraint on (team_id, slot_number)

**RLS Policies:**
- Users can SELECT/INSERT/UPDATE/DELETE their own teams and team_slots (via `auth.uid() = user_id` on teams, join through team_id for slots)
- Admins get full access

### 2. New Page: `src/pages/TeamBuilder.tsx`

**Route:** `/tools/team-builder`

**UI Structure (inspired by reference site):**
- Team title input at top
- 5 hero slot cards in a horizontal row (responsive grid)
  - Slot 1 labeled "Leader"
  - Each slot: hero selector (searchable dropdown from `heroes` table), plus sub-selectors for weapon, imprint, and 3 armor set dropdowns
  - Show hero image/name when selected
- Strategy notes section with tabs: "Preview" (rendered markdown with entity markup) and "Write" (textarea)
- Action buttons: "Save Team", "New Team"
- Saved teams list (sidebar or above) showing user's existing teams to load/edit/delete

**Data fetching (React Query):**
- Fetch all heroes, weapons, imprints, armor_sets for selector dropdowns
- Fetch user's saved teams

**Auth requirement:** Must be logged in. Show sign-in prompt if not authenticated.

### 3. Routing Changes

**`App.tsx`:**
- Import `TeamBuilder` page
- Add route `/tools/team-builder` (not gated by feature flag since tools flag controls the `/tools` index only, or gate it similarly)

**`Tools.tsx`:**
- Update Team Builder card status from "Coming Soon" to "Available" and make it a clickable `Link`

### 4. Key Implementation Details

- Use `CommandDialog` or `Select` with search for hero/weapon/imprint/armor set pickers (consistent with existing patterns)
- Markdown preview uses `MDEditor.Markdown` with `preprocessMarkup` + `rehypeRaw` (same as BuildDetail, GuideDetail)
- Save creates/updates both `teams` and `team_slots` rows in a single operation
- "New Team" clears form state for a fresh composition
- Equipment selectors are optional — only hero selection is required per slot

### 5. Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/TeamBuilder.tsx` | Create — main tool page |
| `src/App.tsx` | Add route for `/tools/team-builder` |
| `src/pages/Tools.tsx` | Update Team Builder card to link and mark active |
| Database migration | Create `teams` + `team_slots` tables with RLS |

