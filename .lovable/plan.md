

## Performance Optimization Plan

### Current State (Mobile Score: 24/100)

| Metric | Value | Target |
|--------|-------|--------|
| FCP | 7.3s | <1.8s |
| LCP | 7.7s | <2.5s |
| TBT | 1,510ms | <200ms |
| CLS | 0.196 | <0.1 |
| SI | 7.3s | <3.4s |

### Root Causes Identified

1. **839 KiB single JS bundle** -- every page (all 40+ routes, admin panel, MDEditor, recharts, etc.) loads in one chunk
2. **Render-blocking Google Fonts** via `@import` in CSS -- adds 750ms to critical path
3. **CLS from web fonts** -- Space Grotesk + Inter swap causes the "Explore" section to shift (0.196 CLS)
4. **No lazy loading on images** -- all news/guide images load eagerly
5. **EntityTooltipProvider preloads all mechanics + heroes** on every page load (2 extra Supabase queries)
6. **No preconnect hints** to Supabase or Google Fonts origins

### Implementation Plan

#### 1. Code-split routes with React.lazy (biggest impact -- targets FCP, LCP, TBT, SI)

Convert all page imports in `App.tsx` to lazy imports with `React.lazy()` and wrap `<Routes>` in `<Suspense>`. This alone should cut the initial bundle from ~839 KiB to ~100-150 KiB.

Split into groups:
- **Eager**: Index (home page)
- **Lazy**: All other pages, especially heavy ones (admin/*, TeamBuilder, BossDetail, BuildDetail which pull in MDEditor/recharts)

#### 2. Fix font loading (targets FCP, CLS)

- Remove the `@import url(...)` from `index.css`
- Add `<link rel="preconnect">` for `fonts.googleapis.com` and `fonts.gstatic.com` in `index.html`
- Add the font `<link>` with `display=swap` directly in `index.html`
- Add `font-display: optional` or size-adjust fallback to reduce CLS from font swap

#### 3. Add preconnect hints (targets FCP, LCP)

Add to `index.html`:
```html
<link rel="preconnect" href="https://yawfmtkrnewpdxjdypmc.supabase.co" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

#### 4. Lazy load below-fold images (targets LCP, SI)

Add `loading="lazy"` to all `<img>` tags in news cards, guide cards, and other list pages. Keep the first/hero image eager.

#### 5. Defer EntityTooltipProvider data loading (targets TBT)

The `preloadMechanicTypes()` and `preloadHeroRarities()` calls fire on mount of every page. Defer them with `requestIdleCallback` or only trigger on first hover of an entity link.

#### 6. Defer Google Analytics (targets TBT)

Move the gtag script to load after the page is interactive by adding `defer` or loading it via `requestIdleCallback` in a small inline script.

### Files to Change

- `index.html` -- preconnect hints, font links, defer gtag
- `src/index.css` -- remove `@import` for Google Fonts
- `src/App.tsx` -- convert all imports to `React.lazy`, add `Suspense`
- `src/pages/Index.tsx` -- add `loading="lazy"` to below-fold images
- `src/components/EntityTooltipProvider.tsx` -- defer preload calls

### Expected Impact

| Change | Est. Score Impact |
|--------|------------------|
| Code splitting | +25-35 points (FCP, LCP, TBT, SI all improve) |
| Font optimization | +5-10 points (FCP, CLS) |
| Preconnect hints | +3-5 points (FCP, LCP) |
| Image lazy loading | +2-3 points (SI) |
| Defer tooltip preloads | +2-3 points (TBT) |
| Defer analytics | +1-2 points (TBT) |

Realistic target: **60-75 on mobile** after these changes.

