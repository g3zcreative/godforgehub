#!/usr/bin/env python3
import os
import sys
import json
import re
import requests
from datetime import datetime, timezone, timedelta
import argparse

# Path definitions relative to script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
SUMMARIES_DIR = os.path.join(ROOT_DIR, "discord_summaries")
LAST_SEEN_PATH = os.path.join(DATA_DIR, "discord_last_seen.json")
CHANNELS_CACHE_PATH = os.path.join(DATA_DIR, "discord_channels.json")

def load_env():
    """Loads environment variables from the .env file in the project root, handling comments."""
    env_path = os.path.join(ROOT_DIR, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                
                # Strip inline comments while respecting quoted strings
                in_quote = False
                quote_char = None
                comment_idx = -1
                for idx, char in enumerate(line):
                    if char in ('"', "'"):
                        if not in_quote:
                            in_quote = True
                            quote_char = char
                        elif char == quote_char:
                            in_quote = False
                            quote_char = None
                    elif char == "#" and not in_quote:
                        comment_idx = idx
                        break
                if comment_idx != -1:
                    line = line[:comment_idx].strip()
                    
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    os.environ[key] = val

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(SUMMARIES_DIR, exist_ok=True)

# Keyword groups for filtering and fallback categorization
KEYWORDS = {
    "units": [r"\bunit\b", r"\bhero\b", r"\broster\b", r"\bcharacter\b", r"\bskill\b", r"\bability\b", r"\bstat\b", r"\bbuff\b", r"\bnerf\b", r"\bbalance\b"],
    "strategy": [r"\bstrategy\b", r"\bcomp\b", r"\bbuild\b", r"\bteam comp\b", r"\bguide\b", r"\btier\b", r"\bmeta\b", r"\bcombo\b", r"\bsynergy\b", r"\bimprint\b", r"\bweapon\b"],
    "announcements": [r"\bpatch\b", r"\bupdate\b", r"\bannouncement\b", r"\bdev\b", r"\brelease\b", r"\bmaintenance\b", r"\bserver\b"]
}

def load_last_seen():
    """Loads the dictionary mapping channel_id -> last_message_id."""
    if os.path.exists(LAST_SEEN_PATH):
        try:
            with open(LAST_SEEN_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Failed to load last seen state: {e}. Starting fresh.")
    return {}

def save_last_seen(state):
    """Saves the last seen state dictionary."""
    try:
        with open(LAST_SEEN_PATH, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print(f"Error saving last seen state: {e}")

def load_channel_names():
    """Loads the channel ID to name mapping from cache."""
    if os.path.exists(CHANNELS_CACHE_PATH):
        try:
            with open(CHANNELS_CACHE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Failed to load channel name cache: {e}.")
    return {}

def save_channel_names(cache):
    """Saves the channel ID to name mapping to cache."""
    try:
        with open(CHANNELS_CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        print(f"Error saving channel name cache: {e}")

def fetch_channel_name(channel_id, token):
    """Fetches channel metadata to retrieve the name of the channel."""
    url = f"https://discord.com/api/v9/channels/{channel_id}"
    headers = {
        "Authorization": token,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            channel_data = res.json()
            return channel_data.get("name", f"channel-{channel_id}")
        else:
            print(f"API Warning: Failed to fetch channel details for {channel_id}: {res.status_code}")
    except Exception as e:
        print(f"Failed to fetch details for channel {channel_id}: {e}")
    return f"channel-{channel_id}"

def fetch_messages(channel_id, token, last_message_id=None, limit=100):
    """Fetches messages from a Discord channel using a User Authorization token."""
    url = f"https://discord.com/api/v9/channels/{channel_id}/messages"
    headers = {
        "Authorization": token,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    params = {"limit": limit}
    if last_message_id:
        params["after"] = last_message_id

    try:
        res = requests.get(url, headers=headers, params=params, timeout=15)
        if res.status_code == 200:
            return res.json()
        elif res.status_code == 401:
            print(f"Error: Unauthorized! Please check your DISCORD_USER_TOKEN in .env.")
            sys.exit(1)
        elif res.status_code == 403:
            print(f"Error: Forbidden! Your account doesn't have access to channel {channel_id}.")
            return []
        else:
            print(f"API Error fetching channel {channel_id}: {res.status_code} - {res.text}")
            return []
    except Exception as e:
        print(f"Failed to fetch messages for channel {channel_id}: {e}")
        return []

def filter_messages(messages, channel_name):
    """Filters messages for interesting content based on keywords and returns matching ones within the last 24 hours."""
    filtered = []
    now = datetime.now(timezone.utc)
    for msg in messages:
        # Skip system messages or empty messages
        content = msg.get("content", "")
        if not content:
            continue
            
        author = msg.get("author", {})
        username = author.get("username", "Unknown")
        bot = author.get("bot", False)
        
        # Check time window (last 24 hours)
        ts_str = msg.get("timestamp")
        if ts_str:
            try:
                # Parse ISO 8601 string, replacing 'Z' with '+00:00' for tz-aware parsing
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                delta = now - ts
                if delta.total_seconds() > 24 * 3600:
                    continue  # Skip messages older than 24 hours
            except Exception as e:
                print(f"Warning: Failed to parse timestamp {ts_str}: {e}")
                
        # Check if content matches any keyword regex
        matched_categories = []
        for category, patterns in KEYWORDS.items():
            for pattern in patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    matched_categories.append(category)
                    break
        
        if matched_categories:
            filtered.append({
                "id": msg.get("id"),
                "author": username,
                "is_bot": bot,
                "content": content,
                "timestamp": msg.get("timestamp"),
                "categories": list(set(matched_categories)),
                "channel_name": channel_name
            })
            
    # Reverse so they are chronological (oldest to newest)
    filtered.reverse()
    return filtered

def generate_local_summary(filtered_messages, include_header=True):
    """Generates a structured markdown report from filtered messages without using an LLM."""
    if not filtered_messages:
        return "No notable messages regarding units, strategy, or announcements were found in the last 24 hours."
        
    lines = []
    if include_header:
        lines.append(f"# Godforge Discord Daily Summary (Local Fallback)")
        lines.append(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Group by categories
    by_category = {"announcements": [], "units": [], "strategy": []}
    for msg in filtered_messages:
        for cat in msg["categories"]:
            if cat in by_category:
                by_category[cat].append(msg)
                
    for cat_name, msgs in by_category.items():
        if not msgs:
            continue
            
        lines.append(f"## {cat_name.title()}")
        # De-duplicate messages that fit multiple categories visually
        seen_ids = set()
        for m in msgs:
            if m["id"] in seen_ids:
                continue
            seen_ids.add(m["id"])
            
            # Format time
            ts_str = m["timestamp"]
            try:
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                time_display = ts.strftime("%I:%M %p")
            except:
                time_display = ts_str
                
            bot_tag = " [BOT]" if m["is_bot"] else ""
            chan_tag = f" in `#{m['channel_name']}`" if m.get("channel_name") else ""
            lines.append(f"- **@{m['author']}{bot_tag}**{chan_tag} ({time_display}):")
            # Indent multi-line content
            content_indented = "\n  ".join(m["content"].split("\n"))
            lines.append(f"  {content_indented}")
        lines.append("")
        
    return "\n".join(lines)

def summarize_with_gemini(filtered_messages, api_key):
    """Submits the filtered messages to the Gemini API to compile a high-quality summary."""
    if not filtered_messages:
        return "No notable messages regarding units, strategy, or announcements were found in the last 24 hours."
        
    # Serialize messages for the prompt
    formatted_chat = []
    for msg in filtered_messages:
        bot_tag = " [BOT]" if msg["is_bot"] else ""
        chan_tag = f" in #{msg['channel_name']}" if msg.get("channel_name") else ""
        formatted_chat.append(f"[{msg['timestamp']}] @{msg['author']}{bot_tag}{chan_tag}: {msg['content']}")
        
    chat_log = "\n".join(formatted_chat)
    
    prompt = f"""You are an expert game analyst for the game "Godforge".
Below is a log of recent messages fetched from Discord channels.
Please review these messages and compile a daily summary report in Markdown format.

Provide your analysis under the following headers:
- **General Sentiment & Alerts:** Overall chat mood, connection errors, bugs, or milestones.
- **Unit & Hero Analysis:** Buffs, nerfs, performance, and tier lists discussed.
- **Strategy & Meta Shifts:** Team building, gear sets, imprint synergy, and boss fight strategies.
- **Official Updates & Announcements:** Dev announcements, patches, or updates mentioned.

Guidelines:
- Keep the writing objective, concise, and insightful.
- Focus strictly on extracting insights; do not output conversational greetings or introductory text.
- Do not repeat the chat log itself.
- Do NOT output a top-level "#" title (we will generate the main title ourselves).

Here is the chat log:
{chat_log}
"""
    
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key
    }
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    
    try:
        print("Sending filtered messages to Gemini API for summarization...")
        res = requests.post(url, json=payload, headers=headers, timeout=60)
        if res.status_code == 200:
            res_json = res.json()
            candidates = res_json.get("candidates", [])
            if candidates:
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if parts:
                    return parts[0].get("text", "")
            print("Warning: Gemini returned empty content or unexpected format.")
        else:
            print(f"Gemini API returned error: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"Gemini API request failed: {e}")
        
    return None

def load_heroes():
    """Loads hero names and slugs from src/data/heroes/*.json."""
    heroes_dir = os.path.join(ROOT_DIR, "src", "data", "heroes")
    heroes = []
    if not os.path.exists(heroes_dir):
        print(f"Warning: Heroes directory not found: {heroes_dir}")
        return heroes
    for filename in os.listdir(heroes_dir):
        if filename.endswith(".json"):
            path = os.path.join(heroes_dir, filename)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "name" in data and "slug" in data:
                        heroes.append({
                            "name": data["name"],
                            "slug": data["slug"]
                        })
            except Exception as e:
                print(f"Error reading hero file {filename}: {e}")
    return heroes

def clean_json_response(text):
    """Cleans markdown code block wraps from LLM JSON responses."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def generate_news_newsletter_via_gemini(filtered_messages, api_key):
    """Calls Gemini to write a newsletter summary based on daily Discord logs."""
    formatted_chat = []
    for msg in filtered_messages:
        bot_tag = " [BOT]" if msg["is_bot"] else ""
        chan_tag = f" in #{msg['channel_name']}" if msg.get("channel_name") else ""
        formatted_chat.append(f"[{msg['timestamp']}] @{msg['author']}{bot_tag}{chan_tag}: {msg['content']}")
    chat_log = "\n".join(formatted_chat)
    
    prompt = f"""You are a community manager and newsletter writer for the game "Godforge".
Below is a log of recent messages from the Godforge Discord channels.
Please synthesize these discussions into a formal, engaging community newsletter article for the website's news section.

Format your response EXACTLY as follows (do not use markdown code block tags around the overall response, just output the plain text sections):
TITLE: [An engaging, catchy title for the newsletter, e.g. "Discord Pulse: Svarog Meta Shifts and Dev Updates"]
EXCERPT: [A compelling 1-2 sentence summary of the article]
CONTENT:
[Engaging, well-formatted news article body in markdown. Use headings, bullet points, and bold text. Keep it readable, professional, and positive. Avoid mentioning specific user handles like '@eko18' directly; instead, refer to "players" or "the community".]

Here is the chat log:
{chat_log}
"""
    
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key
    }
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=60)
        if res.status_code == 200:
            res_json = res.json()
            candidates = res_json.get("candidates", [])
            if candidates:
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if parts:
                    text = parts[0].get("text", "")
                    title_match = re.search(r"^TITLE:\s*(.*)$", text, re.IGNORECASE | re.MULTILINE)
                    excerpt_match = re.search(r"^EXCERPT:\s*(.*)$", text, re.IGNORECASE | re.MULTILINE)
                    content_start = text.find("CONTENT:")
                    
                    title = title_match.group(1).strip() if title_match else "Discord Community Pulse"
                    excerpt = excerpt_match.group(1).strip() if excerpt_match else "Community updates from Discord."
                    
                    if content_start != -1:
                        content_body = text[content_start + len("CONTENT:"):].strip()
                    else:
                        content_body = text
                        
                    return title, excerpt, content_body
    except Exception as e:
        print(f"Error calling Gemini for newsletter: {e}")
    return None

def generate_and_save_news_draft(filtered_messages, api_key, date_str):
    """Formats and writes the newsletter draft markdown file with frontmatter."""
    import uuid
    news_dir = os.path.join(ROOT_DIR, "src", "data", "news")
    os.makedirs(news_dir, exist_ok=True)
    filename = f"community-pulse-{date_str}.md"
    news_path = os.path.join(news_dir, filename)
    
    slug = f"community-pulse-{date_str}"
    title = f"Discord Community Pulse - {date_str}"
    excerpt = "A summary of recent discussions, strategies, and updates from the Godforge Discord community."
    content = "No community activity reported."
    
    if filtered_messages:
        if api_key:
            newsletter_data = generate_news_newsletter_via_gemini(filtered_messages, api_key)
            if newsletter_data:
                title, excerpt, content = newsletter_data
        else:
            title = f"Discord Community Pulse - {date_str} (Fallback)"
            excerpt = f"Community logs and activity summary for {date_str}."
            content = "### Community Activity Summary\n\n" + generate_local_summary(filtered_messages, include_header=False)
            
    post_uuid = str(uuid.uuid4())
    pub_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    
    markdown_content = f"""---
id: "{post_uuid}"
title: "{title}"
slug: "{slug}"
category: "Community"
published: false
published_at: "{pub_time}"
author: "Xsunami"
excerpt: "{excerpt.replace('"', '\\"')}"
---
{content}
"""
    with open(news_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)
    
    print(f"Generated news draft saved to: {news_path}")

def analyze_hero_sentiment_via_gemini(filtered_messages, discussed_heroes, api_key):
    """Calls Gemini to analyze meta/sentiment for discussed heroes based on chat logs."""
    formatted_chat = []
    for msg in filtered_messages:
        chan_tag = f" in #{msg['channel_name']}" if msg.get("channel_name") else ""
        formatted_chat.append(f"@{msg['author']}{chan_tag}: {msg['content']}")
    chat_log = "\n".join(formatted_chat)
    
    heroes_info = ", ".join([f"{h['name']} (slug: {h['slug']})" for h in discussed_heroes])
    
    prompt = f"""You are an expert game analyst for the game "Godforge".
Below is a log of recent Discord messages and a list of heroes that were mentioned in these discussions:
Heroes mentioned: {heroes_info}

Please analyze the player consensus, pros, and cons discussed for each of these heroes based on the chat logs.
For each hero, output a JSON object mapping their slug to their sentiment details.

Output format must be a valid JSON object matching this schema:
{{
  "hero_slug": {{
    "summary": "2-3 sentences player consensus on their strength, role, or meta usage.",
    "pros": ["advantage 1", "advantage 2"],
    "cons": ["disadvantage 1", "disadvantage 2"]
  }}
}}

Ensure that you only output the raw JSON object. Do not include markdown code block formatting (like ```json ... ```) or any additional conversational text.

Here is the chat log:
{chat_log}
"""
    
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key
    }
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=60)
        if res.status_code == 200:
            res_json = res.json()
            candidates = res_json.get("candidates", [])
            if candidates:
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if parts:
                    text = parts[0].get("text", "")
                    cleaned_text = clean_json_response(text)
                    return json.loads(cleaned_text)
    except Exception as e:
        print(f"Error calling Gemini for hero sentiment: {e}")
    return {}

def process_hero_sentiment(filtered_messages, api_key):
    """Identifies discussed heroes in logs, generates sentiments, and merges them into the sentiment database."""
    if not filtered_messages:
        return
    
    heroes = load_heroes()
    if not heroes:
        print("No heroes found in database, skipping sentiment analysis.")
        return
        
    discussed_heroes = []
    for hero in heroes:
        pattern = r"\b" + re.escape(hero["name"].lower()) + r"\b"
        for msg in filtered_messages:
            if re.search(pattern, msg["content"].lower()):
                discussed_heroes.append(hero)
                break
                
    if not discussed_heroes:
        print("No discussed heroes identified in messages today.")
        return
        
    print(f"Identified discussed heroes: {[h['name'] for h in discussed_heroes]}")
    
    new_sentiments = {}
    if api_key:
        new_sentiments = analyze_hero_sentiment_via_gemini(filtered_messages, discussed_heroes, api_key)
    else:
        print("No GEMINI_API_KEY, using local fallback sentiment details.")
        for hero in discussed_heroes:
            new_sentiments[hero["slug"]] = {
                "summary": f"{hero['name']} is being actively discussed in community channels regarding recent meta builds and synergies.",
                "pros": [f"High synergy in current compositions", f"Popular pick for specific team comps"],
                "cons": [f"Requires specific gear investments", f"Debated balance standing"]
            }
            
    if not new_sentiments:
        print("No sentiment data generated.")
        return
        
    sentiment_path = os.path.join(ROOT_DIR, "src", "data", "hero_sentiment.json")
    existing_data = {}
    if os.path.exists(sentiment_path):
        try:
            with open(sentiment_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
        except Exception as e:
            print(f"Warning: Failed to load existing sentiment file: {e}")
            
    today_date = datetime.now().strftime("%Y-%m-%d")
    
    for slug, data in new_sentiments.items():
        existing_data[slug] = {
            "summary": data.get("summary", ""),
            "pros": data.get("pros", []),
            "cons": data.get("cons", []),
            "last_updated": today_date
        }
        
    try:
        os.makedirs(os.path.dirname(sentiment_path), exist_ok=True)
        with open(sentiment_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=2)
        print(f"Hero sentiment database updated at: {sentiment_path}")
    except Exception as e:
        print(f"Error saving hero sentiment database: {e}")

def run_test_mode(api_key):
    """Simulates message fetching and summarization using mock data for verification."""
    print("Running in test/mock mode...")
    
    # Create timestamps that are within the last 2 hours (so they pass the 24h filter)
    now = datetime.now(timezone.utc)
    ts1 = (now - timedelta(hours=1)).isoformat()
    ts2 = (now - timedelta(minutes=45)).isoformat()
    ts3 = (now - timedelta(minutes=30)).isoformat()
    ts4 = (now - timedelta(minutes=15)).isoformat()
    ts5 = (now - timedelta(minutes=5)).isoformat()
    
    mock_messages = [
        {
            "id": "100001",
            "content": "Svarog seems crazy strong right now in Avalon teams. The weapon synergy with fire imprint is doing 2x damage.",
            "author": {"username": "TheorycrafterA", "bot": False},
            "timestamp": ts1
        },
        {
            "id": "100002",
            "content": "Is Ankhesenamun good for the new guild boss? I feel like her shield cooldown is too long.",
            "author": {"username": "CasualPlayer1", "bot": False},
            "timestamp": ts2
        },
        {
            "id": "100003",
            "content": "Use Ankhesenamun with Ekur speed buffs. It drops the effective cooldown and lets you cycle shield before the boss slam.",
            "author": {"username": "ProGamer99", "bot": False},
            "timestamp": ts3
        },
        {
            "id": "100004",
            "content": "Attention @everyone, we are releasing patch v1.0.4 tonight. This includes minor balance buffs to Izumo heroes.",
            "author": {"username": "DevAnnouncer", "bot": True},
            "timestamp": ts4
        },
        {
            "id": "100005",
            "content": "Did they nerf Aaru faction? The passive heals seem weaker today.",
            "author": {"username": "WorriedPlayer", "bot": False},
            "timestamp": ts5
        }
    ]
    
    filtered = filter_messages(mock_messages, channel_name="general-strategy")
    print(f"Filtered {len(filtered)} out of {len(mock_messages)} mock messages.")
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    if not filtered:
        summary = f"# Godforge Discord Daily Report ({today_str})\n\nNo notable activity in the last 24 hours."
    else:
        local_logs = generate_local_summary(filtered, include_header=False)
        if api_key:
            ai_summary = summarize_with_gemini(filtered, api_key)
            if ai_summary:
                summary = f"""# Godforge Discord Daily Report ({today_str})

## Executive AI Summary
{ai_summary}

---

## Detailed Message Logs
{local_logs}
"""
            else:
                summary = generate_local_summary(filtered, include_header=True)
        else:
            print("No GEMINI_API_KEY found, running fallback local summary.")
            summary = generate_local_summary(filtered, include_header=True)
        
    test_file_path = os.path.join(SUMMARIES_DIR, "summary_test.md")
    with open(test_file_path, "w", encoding="utf-8") as f:
        f.write(summary)
        
    print(f"\n--- Summary Generated at {test_file_path} ---")
    print(summary)
    print("-------------------------------------------------")
    print("Generating news draft and updating hero sentiment for test mode...")
    generate_and_save_news_draft(filtered, api_key, "test")
    process_hero_sentiment(filtered, api_key)
    print("Test mode completed successfully!")

def main():
    parser = argparse.ArgumentParser(description="Monitor Discord channels and generate daily summaries.")
    parser.add_argument("--test", "-t", action="store_true", help="Run in test/mock mode with mock data")
    args = parser.parse_args()
    
    load_env()
    
    token = os.environ.get("DISCORD_USER_TOKEN")
    channels_str = os.environ.get("DISCORD_CHANNEL_IDS")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    
    if args.test:
        run_test_mode(gemini_key)
        sys.exit(0)
        
    if not token:
        print("Error: DISCORD_USER_TOKEN is not configured in your .env file.")
        print("To retrieve your user token, log in to Discord Web, open Developer Tools (F12),")
        print("go to the Network tab, search for '/api', click any request, and copy the 'Authorization' header value.")
        sys.exit(1)
        
    if not channels_str:
        print("Error: DISCORD_CHANNEL_IDS is not configured in your .env file.")
        print("Please enable Developer Mode in Discord, right-click the channels you want to monitor,")
        print("and copy their IDs into DISCORD_CHANNEL_IDS as a comma-separated list.")
        sys.exit(1)
        
    channel_ids = [cid.strip() for cid in channels_str.split(",") if cid.strip()]
    if not channel_ids:
        print("Error: No valid channel IDs found in DISCORD_CHANNEL_IDS.")
        sys.exit(1)
        
    last_seen_state = load_last_seen()
    channel_names = load_channel_names()
    all_filtered_messages = []
    
    print(f"Starting Discord Monitor for {len(channel_ids)} channels...")
    
    names_updated = False
    for channel_id in channel_ids:
        # Check if channel name is in cache
        if channel_id not in channel_names:
            print(f"Fetching channel metadata for {channel_id}...")
            chan_name = fetch_channel_name(channel_id, token)
            channel_names[channel_id] = chan_name
            names_updated = True
        
        chan_name = channel_names[channel_id]
        last_msg_id = last_seen_state.get(channel_id)
        print(f"Fetching channel #{chan_name} (after message ID: {last_msg_id})...")
        
        messages = fetch_messages(channel_id, token, last_message_id=last_msg_id)
        if not messages:
            print(f"No new messages found or failed to fetch for channel #{chan_name}.")
            continue
            
        print(f"Retrieved {len(messages)} new messages.")
        
        # Filter messages
        filtered = filter_messages(messages, channel_name=chan_name)
        print(f"{len(filtered)} messages matched keyword filters.")
        
        all_filtered_messages.extend(filtered)
        
        # Update last seen message ID
        # Discord returns messages in reverse-chronological order (newest first)
        newest_msg_id = messages[0].get("id")
        if newest_msg_id:
            last_seen_state[channel_id] = newest_msg_id
            
    # Sort all aggregated messages chronologically by timestamp
    all_filtered_messages.sort(key=lambda m: m["timestamp"])
    
    # Save the updated state
    save_last_seen(last_seen_state)
    if names_updated:
        save_channel_names(channel_names)
        
    # Generate summary
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    if not all_filtered_messages:
        summary_content = f"# Godforge Discord Daily Report ({today_str})\n\nNo notable activity regarding units, strategy, or announcements occurred in the last 24 hours."
    else:
        if gemini_key:
            ai_summary = summarize_with_gemini(all_filtered_messages, gemini_key)
            if ai_summary:
                local_logs = generate_local_summary(all_filtered_messages, include_header=False)
                summary_content = f"# Godforge Discord Daily Report ({today_str})\n\n## Executive AI Summary\n{ai_summary}\n\n---\n\n## Detailed Message Logs\n{local_logs}"
            else:
                summary_content = generate_local_summary(all_filtered_messages, include_header=True)
        else:
            print("GEMINI_API_KEY not found in env, using structural fallback summarization.")
            summary_content = generate_local_summary(all_filtered_messages, include_header=True)
        
    # Write summary to file
    summary_filename = f"summary_{today_str}.md"
    summary_path = os.path.join(SUMMARIES_DIR, summary_filename)
    
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write(summary_content)
        
    print(f"\nSuccess! Daily summary saved to: {summary_path}")
    
    # Generate News Draft and update Hero Sentiment
    print("Generating news draft and updating hero sentiment...")
    generate_and_save_news_draft(all_filtered_messages, gemini_key, today_str)
    process_hero_sentiment(all_filtered_messages, gemini_key)

if __name__ == "__main__":
    main()
