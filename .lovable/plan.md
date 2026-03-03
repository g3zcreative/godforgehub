

## Internal Admin Documentation Page

A dedicated `/admin/docs` page inside the admin dashboard that serves as a living reference guide for content management conventions and best practices.

### What it covers

- **Changelog conventions**: Version numbering (semver explanation), change types (feature/improvement/bugfix/new), writing good titles and descriptions
- **Content guidelines**: How to write news articles, guides, official posts
- **Feature flags**: What each flag controls
- **Roadmap**: Status meanings (planned/in-progress/completed)
- **General tips**: Markdown formatting reference, image URLs, slug conventions

### Technical approach

1. **New page `src/pages/admin/AdminDocs.tsx`** -- A static reference page using accordions to organize sections. No database needed; content lives directly in the component as structured data.

2. **Sidebar & routing** -- Add a "Docs" link with a `BookOpen` or `FileQuestion` icon to the Platform group in `AdminLayout.tsx`, and register `/admin/docs` in `App.tsx`.

3. **Content structure** -- Each section rendered as an `Accordion` item with markdown-like formatted content using existing Tailwind prose styles. Sections include:
   - Changelog & Versioning (e.g., "Use `MAJOR.MINOR.PATCH` -- bump PATCH for bugfixes, MINOR for new features, MAJOR for breaking/large changes")
   - Writing News & Guides
   - Feature Flags Reference
   - Roadmap Statuses
   - Markdown Cheat Sheet

This is a lightweight, zero-dependency addition -- just a new React component with static content, a route, and a sidebar link.

