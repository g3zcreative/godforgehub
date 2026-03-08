

## Community System: User Collections & Onboarding

### Overview
Add user collection tables, a starter hero selection flow for first-time sign-ins, and a user profile/dashboard page where users can manage their hero, weapon, and imprint collections.

### Database Changes

**1. New table: `user_heroes`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | FK to auth.users, ON DELETE CASCADE |
| hero_id | uuid NOT NULL | FK to heroes |
| source | text | "starter", "godforge_go", "manual" |
| created_at | timestamptz | default now() |
| UNIQUE(user_id, hero_id) | | prevent duplicates |

**2. New table: `user_weapons`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | FK to auth.users |
| weapon_id | uuid NOT NULL | FK to weapons |
| source | text | |
| created_at | timestamptz | |
| UNIQUE(user_id, weapon_id) | | |

**3. New table: `user_imprints`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | FK to auth.users |
| imprint_id | uuid NOT NULL | FK to imprints |
| source | text | |
| created_at | timestamptz | |
| UNIQUE(user_id, imprint_id) | | |

**4. Add column to `profiles`:**
- `onboarding_complete` boolean DEFAULT false

**RLS for all three user_* tables:**
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`
- Admins: full access via `has_role`

### Auth Flow Changes

**Post-sign-in redirect logic** (in `Auth.tsx` and `useAuth`):
- After successful sign in, check `profiles.onboarding_complete`
- If `false` → redirect to `/onboarding` instead of `/`
- If `true` → redirect to `/` (or `/profile`)

### Onboarding Page (`/onboarding`)

A full-screen, step-by-step experience:

**Step 1 — Choose Your Starter Hero**
- Display 3 hero cards (Ramses, Lady Xoc, Guan Yu) fetched from the `heroes` table by slug
- Show hero image, name, rarity, archetype, affinity
- User clicks one to select, confirm button proceeds
- On confirm: insert chosen hero + Isolde into `user_heroes` with source "starter"

**Step 2 — Welcome / Done**
- Brief welcome message explaining they can add Godforge Go rewards from their profile
- Set `profiles.onboarding_complete = true`
- Redirect to `/profile`

### Profile / Dashboard Page (`/profile`)

A new page accessible from the user dropdown menu:

**Sections:**
- **My Heroes** — grid of hero cards from `user_heroes` joined with `heroes`
- **My Weapons** — grid from `user_weapons` joined with `weapons`
- **My Imprints** — grid from `user_imprints` joined with `imprints`
- **Add from Godforge Go** — button/section that opens a dialog to search and add a hero, weapon, or imprint to the collection (source: "godforge_go")

Each collection item shows the entity's image, name, and rarity. Items link to their detail pages.

### Routing & Navigation Changes

- Add route `/onboarding` → `Onboarding` (lazy loaded)
- Add route `/profile` → `Profile` (lazy loaded)
- Update Navbar user dropdown: add "My Collection" link to `/profile` (for signed-in users)
- Update `Auth.tsx` sign-in handler to check onboarding status before redirecting

### Files to Create
- `src/pages/Onboarding.tsx` — starter hero selection flow
- `src/pages/Profile.tsx` — user dashboard with collections and "add from Godforge Go" functionality

### Files to Edit
- `src/App.tsx` — add lazy routes for `/onboarding` and `/profile`
- `src/pages/Auth.tsx` — post-sign-in redirect logic checks onboarding status
- `src/components/layout/Navbar.tsx` — add "My Collection" to user dropdown
- Migration SQL — create 3 tables, alter profiles, add RLS

### Implementation Order
1. Database migration (3 tables + profiles column + RLS)
2. Update Auth.tsx sign-in to check onboarding
3. Build Onboarding page
4. Build Profile page with collections + "Add from Godforge Go" dialog
5. Add routes and nav links

