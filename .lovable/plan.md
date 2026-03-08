

## Next Performance & SEO Optimizations

### Current Scores (Mobile)
| Metric | Value | Status |
|--------|-------|--------|
| Performance | 77 | Good, room to improve |
| FCP | 3.0s | Needs work |
| LCP | 3.2s | Needs work |
| TBT | 60ms | Excellent |
| **CLS** | **0.196** | **Main problem** |
| SEO | 100 | Perfect |

### Remaining Issues (from report)

1. **CLS 0.196** — The entire "Explore" section shifts when Space Grotesk and Inter web fonts load and swap. This is the single biggest remaining issue (worth 16 points in the score).

2. **Google Fonts still render-blocking** — The `<link rel="stylesheet">` in `index.html` blocks rendering for 750ms while it fetches the CSS, then chains to woff2 files (another 1,528ms). Critical path is 2,050ms.

3. **No cache headers on main JS/CSS assets** — Vite-hashed assets (`index-*.js`, `index-*.css`) have no cache TTL set.

### Plan

#### 1. Fix CLS by eliminating font swap shift (biggest impact: +10-16 points)

The CLS culprit is `font-display: swap` causing the "Explore" section to reflow when fonts arrive. Fix by:

- **Change Google Fonts to `display=optional`** instead of `display=swap` — this tells the browser to use the fallback font if the web font hasn't loaded within ~100ms, eliminating layout shift entirely. The tradeoff is the custom font may not show on very first visit (subsequent visits use cached font).
- **Add CSS `size-adjust` fallback fonts** in `index.css` to make the system font fallback match the web font metrics closely, so even if swap occurs the shift is negligible.

```css
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
  descent-override: 25%;
  line-gap-override: 0%;
}
```

Update `tailwind.config.ts` font stacks to include the metric-matched fallback.

#### 2. Make Google Fonts non-render-blocking (targets FCP, LCP: +5-8 points)

The `<link rel="stylesheet">` is still render-blocking. Change to a non-blocking pattern:

```html
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?...&display=optional" onload="this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="..." /></noscript>
```

This loads the font CSS asynchronously so it never blocks first paint.

#### 3. Add immutable cache headers via Vite config (targets repeat visits)

Vite already hashes filenames. We can't control hosting headers directly, but we can note this is a hosting-level config. If using Lovable's default hosting, this is already handled. The report flags it but it's low priority.

### Files to Change

- `index.html` — switch font link to `preload` pattern, change `display=swap` to `display=optional`
- `src/index.css` — add `@font-face` declarations for metric-matched fallback fonts
- `tailwind.config.ts` — update font stacks to include fallback fonts

### Expected Impact

| Change | Est. Score Impact |
|--------|------------------|
| Fix CLS via `display=optional` + size-adjust fallbacks | +10-16 points |
| Non-blocking font loading | +5-8 points |

**Realistic target: 90+ on mobile.**

