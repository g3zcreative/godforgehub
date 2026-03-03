

## Plan: Discord-First Official Post Tracker

### Current State
The Official Posts system already works well — the `official_posts` table has fields for `author`, `author_role`, `source`, `content`, `region`, and `posted_at`. The admin panel (`AdminOfficialPosts`) lets you manually create posts. The public Community page and homepage both display them.

### What to Build Now

Since you want manual entry now with automation later, the focus is on making the manual workflow as smooth as possible and preparing the data model for future Discord bot integration.

**1. Improve the admin entry flow for Discord posts**
- Pre-fill `source` as "Discord" by default
- Add a `channel_name` field to track which Discord channel the post came from (e.g. #announcements, #dev-updates)
- Add a `message_url` field so you can link back to the original Discord message
- Add a `discord_message_id` field (hidden from UI for now) to prevent duplicates when automation arrives

**2. Database migration**
Add three columns to `official_posts`:
- `channel_name` (text, nullable)
- `message_url` (text, nullable) 
- `discord_message_id` (text, nullable, unique) — for future dedup

**3. Update the public Community page**
- Show channel name as a tag (e.g. "#announcements")
- Make posts linkable back to the original Discord message when `message_url` is set

**4. Update the admin form**
- Add the new fields to `AdminOfficialPosts` column config
- Default `source` to "Discord"

### Future Automation Path (not built now)
When you're ready to automate, the approach would be:
- Create a backend webhook endpoint that accepts Discord bot payloads
- Build or configure a Discord bot that watches specific channels and POSTs to your webhook
- The webhook inserts into `official_posts`, using `discord_message_id` to prevent duplicates

The schema changes made now will make that transition seamless.

### Files to Change
- **Database migration**: Add `channel_name`, `message_url`, `discord_message_id` columns to `official_posts`
- `src/pages/admin/AdminOfficialPosts.tsx` — add new fields, default source to Discord
- `src/pages/Community.tsx` — show channel name, link to original message
- `src/pages/Index.tsx` — optionally show channel name in post tracker cards

