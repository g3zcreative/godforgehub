

## Analysis: Current Setup vs. Hero Builds

### Current `hero_recommendations` Problem

The existing `hero_recommendations` table is a flat list of individual item suggestions per hero (one weapon row, one imprint row, one synergy row). It has no concept of a **build** -- a coherent combination of gear + team + strategy. This means:

- You can't have multiple builds per hero (e.g. "PvP Build" vs "Boss Build")
- No written guide content or video per recommendation set
- No way for users to author their own builds later
- No armor sets
- Recommendations aren't grouped -- they're just loose suggestions

### Proposed: `hero_builds` System

Replace `hero_recommendations` with a proper builds model.

#### New Tables

**`armor_sets`** (reference table for the new entity type)

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | Required |
| slug | text | Unique |
| description | text | Nullable |
| set_bonus | text | Nullable -- describes the set effect |
| image_url | text | Nullable |
| created_at / updated_at | timestamptz | |

**`hero_builds`**

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| hero_id | uuid | FK to heroes |
| title | text | e.g. "PvP Burst Build" |
| slug | text | Unique |
| author_id | uuid | Nullable FK to profiles (null = admin/editorial) |
| weapon_id | uuid | Nullable FK to weapons |
| imprint_id | uuid | Nullable FK to imprints |
| armor_set_id | uuid | Nullable FK to armor_sets |
| content | text | Markdown guide content |
| video_url | text | Nullable |
| published | boolean | Default false |
| featured | boolean | Default false -- admin-curated builds shown on hero page |
| sort_order | integer | Default 0 |
| created_at / updated_at | timestamptz | |

**`hero_build_synergies`** (many-to-many for team synergies)

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| build_id | uuid | FK to hero_builds |
| hero_id | uuid | FK to heroes (the synergy hero) |
| note | text | Nullable -- why this hero synergizes |
| sort_order | integer | Default 0 |

#### RLS

- `armor_sets`: public SELECT, admin CUD
- `hero_builds`: public SELECT (where published = true), admin full access, authenticated users can INSERT/UPDATE/DELETE own rows (for future user builds)
- `hero_build_synergies`: public SELECT, admin CUD, authenticated users can manage rows for their own builds

#### Migration Path

- Create the three new tables
- Migrate existing `hero_recommendations` data into `hero_builds` (one build per hero that has recommendations, titled "Recommended Build", marked `featured`)
- Drop `hero_recommendations` after migration

### Code Changes

1. **Admin: `AdminArmorSets.tsx`** -- new CRUD page for armor sets using `AdminCrudPage`
2. **Admin: `AdminBuilds.tsx`** -- new CRUD page for hero builds with synergy management
3. **`HeroDetail.tsx`** -- replace the recommendations query + `RecommendationSection` with a builds section showing featured builds (weapon/imprint/armor/synergies cards + content preview + link to full build page)
4. **New page: `BuildDetail.tsx`** at `/database/heroes/:heroSlug/builds/:buildSlug` -- full build guide view with markdown content, video embed, gear cards, team synergies
5. **Admin nav** -- add Armor Sets and Builds links
6. **App.tsx** -- add routes

### Why This Is Better

- **Multiple builds per hero** with distinct titles and strategies
- **Self-contained**: each build bundles gear + team + content + video as one coherent unit
- **User-generated content ready**: `author_id` + RLS policies let authenticated users create builds later
- **Featured flag** lets admins curate which builds appear on the hero detail page
- **Armor sets** become a first-class entity you can reference elsewhere too

