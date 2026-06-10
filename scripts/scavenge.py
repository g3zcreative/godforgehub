import os
import json
import re
import requests
import uuid
import subprocess
import sys
from bs4 import BeautifulSoup
from datetime import datetime

PREFS_PATH = r"C:\Users\chris\AppData\Local\godforge\prefs.json"
LOGS_DIR = r"C:\Users\chris\AppData\Local\godforge\logs"
GAMES_DIR = r"C:\Users\chris\AppData\Local\godforge\games"
HEROES_DIR = r"e:\godforgehub\src\data\heroes"
METADATA_PATH = r"e:\godforgehub\src\data\game_client_metadata.json"
SCAVENGED_DATA_PATH = r"e:\godforgehub\src\data\scavenged_data.json"
VALIDATOR_PATH = r"e:\godforgehub\scripts\validate_heroes.py"
SCRAPE_URL = "https://yawfmtkrnewpdxjdypmc.supabase.co/functions/v1/scrape-hero"

SLUG_MAPPING = {}



def get_active_game_info():
    """Reads prefs.json to find the currently active game folder and metadata."""
    if not os.path.exists(PREFS_PATH):
        return {
            "error": f"prefs.json not found at {PREFS_PATH}",
            "active_version_dir": "p38bdtfa6c",
            "dir_path": os.path.join(GAMES_DIR, "p38bdtfa6c")
        }
    
    try:
        with open(PREFS_PATH, "r") as f:
            prefs = json.load(f)
        
        current_id = prefs.get("current")
        artifacts = prefs.get("artifacts", {})
        active_art = artifacts.get(current_id, {})
        
        dir_path = active_art.get("dir")
        if not dir_path or not os.path.exists(dir_path):
            dir_path = os.path.join(GAMES_DIR, "p38bdtfa6c")
            
        return {
            "active_version_dir": os.path.basename(dir_path),
            "dir_path": dir_path,
            "name": active_art.get("name"),
            "executable": active_art.get("exec"),
            "access_code": prefs.get("access_code"),
            "prefs_path": PREFS_PATH
        }
    except Exception as e:
        return {
            "error": f"Failed to parse prefs.json: {str(e)}",
            "active_version_dir": "p38bdtfa6c",
            "dir_path": os.path.join(GAMES_DIR, "p38bdtfa6c")
        }

def get_latest_log_info():
    """Scans the latest launcher log for information about the current build/updates."""
    if not os.path.exists(LOGS_DIR):
        return {"error": "Logs directory not found"}
        
    try:
        log_files = [os.path.join(LOGS_DIR, f) for f in os.listdir(LOGS_DIR) if f.endswith(".log")]
        if not log_files:
            return {"msg": "No log files found"}
            
        latest_log = max(log_files, key=os.path.getmtime)
        log_summary = {
            "file": os.path.basename(latest_log),
            "last_modified": datetime.fromtimestamp(os.path.getmtime(latest_log)).isoformat(),
            "notable_events": []
        }
        
        with open(latest_log, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            
        for line in lines[-150:]:
            try:
                data = json.loads(line)
                msg = data.get("msg", "")
                if "DOWNLOAD PROCESS" in msg or "PATCH STEP" in msg or "download started" in msg:
                    log_summary["notable_events"].append({
                        "time": data.get("time"),
                        "level": data.get("level"),
                        "msg": msg,
                        "details": {k: v for k, v in data.items() if k not in ["time", "level", "msg"]}
                    })
            except:
                pass
                
        return log_summary
    except Exception as e:
        return {"error": f"Failed to parse logs: {str(e)}"}

def parse_mpa_config_archive(active_dir):
    """Parses the directory entries of SharedGameConfig.mpa if it exists."""
    mpa_path = os.path.join(active_dir, "Godforge_Data", "StreamingAssets", "SharedGameConfig.mpa")
    if not os.path.exists(mpa_path):
        return {"error": f"SharedGameConfig.mpa not found at {mpa_path}"}
        
    try:
        with open(mpa_path, "rb") as f:
            buffer = f.read()
            
        mpc_indices = []
        idx = -1
        while True:
            idx = buffer.find(b".mpc", idx + 1)
            if idx == -1:
                break
            mpc_indices.append(idx)
            
        entries = []
        for index in mpc_indices:
            start = index
            while start > 0 and 32 <= buffer[start - 1] <= 126:
                start -= 1
                
            name = buffer[start:index + 4].decode('ascii', errors='ignore')
            name_clean = re.sub(r'^[^a-zA-Z0-9_$]+', '', name)
            
            hash_bytes = buffer[index + 4:index + 20]
            
            flag_offset = index + 20
            flag = int.from_bytes(buffer[flag_offset:flag_offset + 4], byteorder='big')
            
            size_offset = index + 24
            size = int.from_bytes(buffer[size_offset:size_offset + 4], byteorder='big')
            
            entries.append({
                "name": name_clean,
                "flag": flag,
                "size_bytes": size,
                "hash": hash_bytes.hex()
            })
            
        return {
            "file_size": len(buffer),
            "total_subfiles": len(entries),
            "files": entries
        }
    except Exception as e:
        return {"error": f"Failed to parse MPA archive: {str(e)}"}

def scrape_godforge_gg_hero_list():
    """Scrapes godforge.gg/heroes and all faction subroutes for the full list of heroes."""
    url = "https://godforge.gg/heroes"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code != 200:
            return []
            
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Dynamically find factions from sidebar button titles
        factions = []
        for btn in soup.find_all('button', title=True):
            title = btn['title'].strip().lower()
            if title:
                factions.append(title)
                
        # Fallback to known default list if parsing failed
        if not factions:
            factions = ["aaru", "asgard", "avalon", "ekur", "izumo", "olympus", "omeyocan", "tian", "vyraj"]
        else:
            factions = list(dict.fromkeys(factions))
            
        print(f"Found factions to scrape: {', '.join(factions)}")
        
        heroes = []
        for faction in factions:
            faction_url = f"https://godforge.gg/heroes/{faction}"
            print(f"Scraping roster for faction: {faction} ({faction_url})")
            try:
                f_res = requests.get(faction_url, timeout=10)
                if f_res.status_code != 200:
                    print(f"Warning: Failed to fetch faction roster for {faction} (status: {f_res.status_code})")
                    continue
                
                f_soup = BeautifulSoup(f_res.text, 'html.parser')
                for a in f_soup.find_all('a', href=True):
                    href = a['href']
                    # Match pattern /heroes/<faction>/<slug>
                    match = re.match(r'^/heroes/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_-]+)$', href)
                    if match:
                        h_faction = match.group(1)
                        slug = match.group(2)
                        name = a.get_text(strip=True) or slug.replace('-', ' ').title()
                        heroes.append({
                            "name": name,
                            "slug": slug,
                            "faction": h_faction,
                            "url": f"https://godforge.gg/heroes/{h_faction}/{slug}"
                        })
            except Exception as fe:
                print(f"Error scraping faction {faction}: {fe}")
                
        # Deduplicate
        seen = set()
        unique_heroes = []
        for h in heroes:
            if h["slug"] not in seen:
                seen.add(h["slug"])
                unique_heroes.append(h)
                
        return unique_heroes
    except Exception as e:
        print("Error fetching list of heroes:", e)
        return []

def scrape_hero_data(hero_url):
    """Calls the Supabase Edge Function to scrape and parse the hero page."""
    try:
        print(f"Calling scraper service for {hero_url}...")
        res = requests.post(SCRAPE_URL, json={"url": hero_url}, timeout=30)
        if res.status_code == 200:
            return res.json()
        else:
            print(f"Scrape function error: {res.status_code} - {res.text}")
            return None
    except Exception as e:
        print(f"Failed to fetch hero data: {str(e)}")
        return None

def main():
    print(f"[{datetime.now().isoformat()}] Starting Serverless Godforge Scavenger...")
    
    # 1. Scavenge local game files and write metadata
    print("Scavenging local game info...")
    game_info = get_active_game_info()
    log_info = get_latest_log_info()
    
    mpa_info = {}
    if "dir_path" in game_info:
        print("Parsing SharedGameConfig.mpa...")
        mpa_info = parse_mpa_config_archive(game_info["dir_path"])
        
    client_metadata = {
        "scavenged_at": datetime.now().isoformat(),
        "version_info": game_info,
        "launcher_logs": log_info,
        "shared_game_config": mpa_info
    }
    
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(client_metadata, f, indent=2, ensure_ascii=False)
    print(f"Saved local client metadata to {METADATA_PATH}")
    
    # 2. Get list of existing heroes from src/data/heroes
    if not os.path.exists(HEROES_DIR):
        os.makedirs(HEROES_DIR)
    local_slugs = {f[:-5] for f in os.listdir(HEROES_DIR) if f.endswith(".json")}
    print(f"Found {len(local_slugs)} local hero profiles.")
    
    # 3. Scrape godforge.gg for current list
    print("Scraping current hero roster from godforge.gg...")
    remote_heroes = scrape_godforge_gg_hero_list()
    print(f"Found {len(remote_heroes)} heroes online.")
    
    # 4. Compare and find new heroes to scrape
    new_heroes = []
    for h in remote_heroes:
        web_slug = h["slug"]
        mapped_slug = SLUG_MAPPING.get(web_slug, web_slug)
        if mapped_slug not in local_slugs:
            new_heroes.append(h)
            
    print(f"Discovered {len(new_heroes)} new heroes to scavenge.")
    
    scraped_count = 0
    for h in new_heroes:
        slug = h["slug"]
        url = h["url"]
        faction = h["faction"]
        
        mapped_slug = SLUG_MAPPING.get(slug, slug)
        print(f"\n--- Scavenging New Hero: {slug.upper()} (saving as {mapped_slug}) ---")
        hero_data = scrape_hero_data(url)
        
        if hero_data:
            # Assign standard stable UUID for relationships
            hero_data["id"] = str(uuid.uuid4())
            # Ensure faction matches slug context
            if "faction" not in hero_data or not hero_data["faction"]:
                hero_data["faction"] = faction.capitalize()
            # Force internal slug to match mapped slug
            hero_data["slug"] = mapped_slug
                
            # Save file
            file_path = os.path.join(HEROES_DIR, f"{mapped_slug}.json")
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(hero_data, f, indent=2, ensure_ascii=False)
            print(f"Successfully saved profile: {file_path}")
            scraped_count += 1
        else:
            print(f"Skipping {slug} due to scraping failures.")
            
    print(f"\nScavenged and created {scraped_count} new hero profiles.")
    
    # Save the consolidated scavenged data (including local game info and website rosters)
    scavenged_data = {
        "scavenged_at": datetime.now().isoformat(),
        "local_game": {
            "version_info": game_info,
            "launcher_logs": log_info,
            "shared_game_config": mpa_info
        },
        "website_data": {
            "total_heroes": len(remote_heroes),
            "heroes": remote_heroes
        }
    }
    with open(SCAVENGED_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(scavenged_data, f, indent=2, ensure_ascii=False)
    print(f"Saved consolidated scavenged data to {SCAVENGED_DATA_PATH}")
    
    # 5. Automatically run the validation schema script
    print("\nRunning schema validation...")
    try:
        val_res = subprocess.run([sys.executable, VALIDATOR_PATH], capture_output=True, text=True)
        print(val_res.stdout)
        if val_res.returncode == 0:
            print("Auto-validation PASSED successfully!")
        else:
            print("Auto-validation FAILED! Please review the error list above.")
            sys.exit(1)
    except Exception as e:
        print("Failed to execute validation script:", e)
        sys.exit(1)

if __name__ == "__main__":
    main()
