

# Admin Panel with Authentication and CRUD

## Overview
Build a full admin panel behind authentication. Includes email auth (signup/login), an admin role system, and CRUD forms for all 9 content tables.

## Database Changes (Migration)

1. **`profiles` table** -- auto-created on signup via trigger
   - `id` (uuid, FK to auth.users), `email` (text), `display_name` (text), `created_at`

2. **`user_roles` table** -- stores admin roles
   - `id` (uuid), `user_id` (uuid FK to auth.users), `role` (app_role enum: admin, moderator, user)
   - Unique on (user_id, role)

3. **`app_role` enum** -- `admin`, `moderator`, `user`

4. **`has_role` security definer function** -- prevents RLS recursion

5. **RLS policies on profiles** -- users read/update own profile

6. **Add INSERT/UPDATE/DELETE policies** on all content tables (heroes, items, skills, materials, news_articles, guides, official_posts, site_changelog, roadmap_items) gated by `has_role(auth.uid(), 'admin')`

7. **Trigger** on `auth.users` to auto-create profile row -- wait, can't attach triggers to auth schema. Instead: use `profiles` insert from the client on signup, or use a Postgres function on `auth.users` via event triggers. Actually, the standard approach is a trigger on `auth.users` using a function in public schema -- this is the accepted Supabase pattern (trigger on auth.users INSERT calling a public function). Let me reconsider -- the instructions say "do not attach triggers to tables in reserved schemas." So I'll handle profile creation client-side on signup.

## Frontend: Authentication

1. **`src/pages/Auth.tsx`** -- Login/Signup page with email + password tabs
2. **`src/hooks/useAuth.tsx`** -- Auth context provider with `onAuthStateChange`, session state, sign-in/up/out functions
3. **`src/hooks/useAdmin.tsx`** -- Hook that checks `user_roles` table for admin role
4. **Route `/auth`** in App.tsx

## Frontend: Admin Panel

1. **`src/pages/admin/AdminLayout.tsx`** -- Sidebar nav with links to each content section, wraps admin pages. Checks admin role and redirects if not admin.

2. **CRUD pages** (one per table, all under `/admin/*`):
   - `/admin/heroes` -- list + create/edit dialog
   - `/admin/items`
   - `/admin/skills`
   - `/admin/materials`
   - `/admin/news`
   - `/admin/guides`
   - `/admin/official-posts`
   - `/admin/changelog`
   - `/admin/roadmap`

3. Each CRUD page pattern:
   - Table listing all rows with edit/delete buttons
   - Dialog/sheet form for create and edit
   - Uses `@tanstack/react-query` for fetching, mutations with `supabase` client
   - Form fields match the table columns
   - Delete with confirmation dialog

4. **Reusable `AdminCrudPage` component** to reduce duplication -- accepts table name, column config, and renders list + form automatically.

## Routing

```
/auth           -- Login/Signup
/admin          -- Admin dashboard (redirect to /admin/heroes)
/admin/heroes   -- Heroes CRUD
/admin/items    -- Items CRUD
...etc
```

Protected via `useAdmin` hook -- if not admin, show "Access Denied" or redirect to home.

## Implementation Order

1. Migration: profiles, user_roles, has_role, RLS policies
2. Auth context + Auth page
3. Admin layout + route protection
4. Generic CRUD component
5. Wire up all 9 content tables
6. Add "Admin" link in navbar (visible only to admins)

