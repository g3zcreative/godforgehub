# Godforge Scavenger Tool

This directory contains the automated scavenger script for compiling game data from local client files and scraping the official game site `godforge.gg`.

A specialized agent `godforge_scavenger` is defined to run and manage this tool.

## What It Scavenges

1. **Local Client metadata**:
   - Locates the game path and active deployment folder from the local launcher's `prefs.json` configuration.
   - Extracts log history and updates from launcher log files.
   - Parses the Metaplay Config Archive (`SharedGameConfig.mpa`) directory index to record internal game libraries (`.mpc` files) and their sizes/hashes.
2. **Public web references**:
   - Crawls the `https://godforge.gg/heroes` listing page to find individual hero links and pantheon/faction names.

## How to Run

To run the scavenger script, execute the following command:

```sh
python scripts/scavenge.py
```

## Scavenged Data Schema

The script writes its outputs to `src/data/scavenged_data.json` with the following structure:

```json
{
  "scavenged_at": "2026-06-09T23:25:00.000000",
  "local_game": {
    "version_info": {
      "active_version_dir": "p38bdtfa6c",
      "dir_path": "C:\\Users\\chris\\AppData\\Local\\godforge\\games\\p38bdtfa6c",
      "name": "Generate by cli 2026-05-29 15:01:26",
      "executable": "Godforge.exe",
      "access_code": "HFocFtjkgPFbhO",
      "prefs_path": "C:\\Users\\chris\\AppData\\Local\\godforge\\prefs.json"
    },
    "launcher_logs": {
      "file": "launcher_log_2026-06-09.log",
      "last_modified": "2026-06-09T19:18:06.351482-04:00",
      "notable_events": [...]
    },
    "shared_game_config": {
      "file_size": 701211,
      "total_subfiles": 58,
      "files": [
        {
          "name": "AbilitiesData.mpc",
          "flag": 1,
          "size_bytes": 210733,
          "hash": "983abc6f3c570639e244760b3f7a719a"
        },
        ...
      ]
    }
  },
  "website_data": {
    "total_heroes": 22,
    "heroes": [
      {
        "name": "Ankhesenamun",
        "slug": "ankhesenamun",
        "faction": "aaru",
        "url": "https://godforge.gg/heroes/aaru/ankhesenamun"
      },
      ...
    ]
  }
}
```
