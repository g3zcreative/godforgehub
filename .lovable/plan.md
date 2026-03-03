
# Godforge Hub — Game Information Hub

A Wowhead-style data-driven information hub for the upcoming gacha game **Godforge** by Fateless Games. Built with a clean modern dark theme, mock data structure ready to be populated as the game approaches launch.

## Pages & Features

### 1. Homepage / Dashboard
- Hero section with game branding and countdown to launch (if date is known)
- **Recent News** feed with timestamps
- **Official Post Tracker** section (simulating Discord/dev post tracking)
- **Featured Guides** carousel
- Quick-access category icons (like Wowhead's class/expansion icons row)

### 2. Navigation Bar
- Sticky top nav with logo, search bar, and main sections: **News**, **Database**, **Guides**, **Tools**, **Community**
- User account menu (login/signup, bookmarks)
- Dark themed with subtle accent colors

### 3. News Section
- News article listing with thumbnails, dates, categories, and tags
- Individual article detail pages
- Filter by category (Patch Notes, Events, Dev Updates, etc.)

### 4. Database Section
- Browsable categories for game entities (placeholder structure):
  - **Characters / Heroes** — rarity, element, class, stats
  - **Items / Equipment** — type, stats, how to obtain
  - **Skills / Abilities** — descriptions, scaling
  - **Materials / Resources** — drop locations, usage
- Each entity has a detail page with structured info cards
- Search and filter functionality across all database entries

### 5. Guides Section
- Guide listing with categories (Beginner, Tier Lists, Team Building, Farming, etc.)
- Individual guide pages with rich text content
- Bookmark/favorite guides (requires login)

### 6. Tools Section
- Placeholder tool pages ready for future interactive tools:
  - **Tier List Viewer** — tier rankings display
  - **Team Builder** — drag-and-drop team composition (placeholder)
  - **Resource Calculator** — material planning (placeholder)

### 7. Community Section
- Links to official Discord, Reddit, social channels
- Community spotlight / fan content area

### 8. Official Post Tracker
- Feed displaying official developer posts (mock data)
- Filter by source (Discord, Twitter/X, Forums)
- Timestamps and region tags (like Wowhead's Blue Tracker)

### 9. Authentication
- Sign up / Login with email (via Supabase)
- Basic user profiles
- Bookmark/favorite system for guides and database entries

### 10. Search
- Global search bar in the nav
- Searches across news, database entries, and guides
- Auto-suggest dropdown with categorized results

## Design
- **Dark background** with clean, minimal UI — no heavy fantasy ornaments
- Accent color TBD (can match game branding when available)
- Card-based layouts for content sections
- Responsive for mobile and desktop
- Consistent icon system using Lucide icons

## Backend (Supabase via Lovable Cloud)
- Database tables for: news articles, database entries (heroes, items, skills, materials), guides, bookmarks, official posts
- Authentication with email
- User profiles with bookmarks
- Row-level security for user data
- All content admin-managed initially (no user-generated content)
