

## Data Sync System

### Overview
Replace the destructive backfill-hero function with a read-only comparison system. A new edge function scrapes godforge.gg, compares against current DB data, and stores diffs in a new `sync_diffs` table. Admins review and accept/reject each diff from a new "Data Sync" admin page.

### Database Changes

**New table: `sync_diffs`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| hero_id | uuid | FK reference |
| hero_name | text | For display |
| field | text | e.g. "description", "stats.hp", "skill:Fireball.description" |
| entity_type | text | "hero", "skill", "imprint" |
| entity_id | uuid | nullable, for skills/imprints |
| current_value | text | JSON-stringified current value |
| incoming_value | text | JSON-stringified scraped value |
| status | text | "pending", "accepted", "rejected" |
| reviewed_by | uuid | nullable |
| reviewed_at | timestamptz | nullable |
| created_at | timestamptz | |
| batch_id | text | Groups diffs from same sync run |

RLS: Admins can SELECT/UPDATE/DELETE/INSERT. No public access.

### Edge Function: `sync-hero` (new, replaces backfill-hero usage)

Same scraping + AI extraction logic as current backfill-hero, but instead of writing to heroes/skills/imprints tables, it:

1. Scrapes godforge.gg page for the hero
2. Extracts structured data via AI (reuse existing prompt)
3. Fetches current hero + skills + imprints from DB
4. Compares each field and generates diffs for any differences
5. Inserts diff rows into `sync_diffs` with status "pending"
6. Returns a summary (number of diffs found)

Key comparison fields:
- **Hero**: subtitle, description, lore, affinity, allegiance, stats (deep compare each stat key), leader_bonus, divinity_generator, ascension_bonuses, awakening_bonuses
- **Skills**: name match, then compare description, skill_type, scaling_formula, effects, awakening_level/bonus, ultimate_cost, initial_divinity
- **Imprint**: passive text

### Admin Page: `AdminDataSync.tsx`

Located at `/admin/data-sync`, added to Platform section in sidebar with a `RefreshCw` icon.

**Features:**
- **Sync controls**: "Sync Single Hero" (dropdown) and "Sync All Heroes" (bulk with progress, same sequential pattern as backfill)
- **Pending diffs table**: Filterable by hero, entity type, status
- **Diff review**: Each row shows field name, current vs incoming value side-by-side with visual diff highlighting
- **Actions**: Accept (applies the change to DB), Reject (marks as rejected), Bulk accept/reject per hero or batch
- **Accept logic**: When accepted, the page makes a direct Supabase update to the relevant table (hero/skill/imprint) for that specific field, then marks the diff as accepted

### Routing & Navigation

- Add `{ title: "Data Sync", url: "/admin/data-sync", icon: RefreshCw }` to `platformItems` in AdminLayout
- Add route in App.tsx: `/admin/data-sync` -> `AdminDataSync`

### Implementation Steps

1. Create `sync_diffs` table via migration with RLS policies (admin-only)
2. Create `sync-hero` edge function (fork from backfill-hero, replace write logic with diff generation)
3. Build `AdminDataSync.tsx` page with sync triggers, diff table, review UI, and accept/reject mutations
4. Add route and sidebar entry
5. Keep existing backfill-hero function untouched (can be deprecated later)

### Technical Notes

- Accept action uses service-role-level access via a small edge function `apply-sync-diff` that validates admin, reads the diff row, and applies the single field update. This avoids needing the frontend to construct arbitrary updates.
- Alternatively, since admins already have RLS write access to heroes/skills/imprints, the frontend can apply accepted changes directly via the Supabase client — simpler approach, recommended.
- Bulk sync reuses the existing sequential-with-delay pattern (3s between heroes) to avoid rate limits.

