

## Plan: Configurable Per-Page Meta Titles and Descriptions

### Approach

Create a new `page_seo` database table that stores custom meta titles and descriptions keyed by route path. A new admin page lets you manage these overrides. The `SEO` component checks for a matching override before falling back to the hardcoded values.

### Database

New table `page_seo`:
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, auto |
| route_path | text | Unique, e.g. `/database/heroes/artemis` or `/news` |
| meta_title | text | Nullable -- if null, use component default |
| meta_description | text | Nullable -- if null, use component default |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

RLS: public SELECT, admin INSERT/UPDATE/DELETE.

### SEO Component Changes

- Add a `url` (or `routePath`) based lookup: query `page_seo` for the current route.
- If a row exists with a non-null `meta_title`, use it instead of the component-provided title.
- Same for `meta_description`.
- Use React Query with aggressive caching (`staleTime: 5min`) to avoid extra requests.

### Admin UI

New page at `/admin/seo` (add to admin routes):
- Table listing all `page_seo` rows (route, title, description).
- Add/edit/delete rows.
- Could reuse the existing `AdminCrudPage` pattern.

### How It Works

1. You visit `/database/imprints/artemis`.
2. The `SEO` component checks `page_seo` for route `/database/imprints/artemis`.
3. If a custom title/description exists, it overrides the component defaults.
4. If no row exists, the current hardcoded logic applies as a fallback.

This gives you full control over any page's metadata without code changes, while keeping the existing dynamic defaults as a safety net.

