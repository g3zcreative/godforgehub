import os
import json
import re
import sys

SCHEMA_PATH = r"e:\godforgehub\src\data\schemas\hero.schema.json"
HEROES_DIR = r"e:\godforgehub\src\data\heroes"

def validate_hero(data, filename):
    errors = []
    
    # 1. Check required fields
    required = ["name", "slug", "rarity", "skills"]
    for field in required:
        if field not in data:
            errors.append(f"Missing required field: '{field}'")
            
    if errors:
        return errors
        
    # 2. Validate types
    if not isinstance(data["name"], str):
        errors.append(f"Field 'name' must be a string, got {type(data['name']).__name__}")
        
    if not isinstance(data["slug"], str):
        errors.append(f"Field 'slug' must be a string, got {type(data['slug']).__name__}")
    else:
        # Check slug pattern
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", data["slug"]):
            errors.append(f"Field 'slug' is invalid: '{data['slug']}'")
        # Check if slug matches filename
        expected_filename = f"{data['slug']}.json"
        if filename != expected_filename:
            errors.append(f"Filename '{filename}' does not match slug '{data['slug']}' (expected '{expected_filename}')")

    if not isinstance(data["rarity"], int) or not (1 <= data["rarity"] <= 5):
        errors.append(f"Field 'rarity' must be an integer between 1 and 5, got {data['rarity']}")

    # Validate optional text fields
    for field in ["subtitle", "description", "lore", "image_url", "divinity_generator", "imprint_passive", "faction", "archetype", "affinity", "allegiance"]:
        if field in data and data[field] is not None and not isinstance(data[field], str):
            errors.append(f"Field '{field}' must be a string or null, got {type(data[field]).__name__}")

    # Validate optional image numbers
    for field in ["image_zoom", "image_focal_x", "image_focal_y"]:
        if field in data and data[field] is not None and not isinstance(data[field], (int, float)):
            errors.append(f"Field '{field}' must be a number, got {type(data[field]).__name__}")

    # Validate stats
    if "stats" in data and data["stats"] is not None:
        if not isinstance(data["stats"], dict):
            errors.append("Field 'stats' must be an object")
        else:
            allowed_stats = ["hp", "atk", "def", "spd", "init", "crit_rate", "crit_dmg", "res", "acc"]
            for k, v in data["stats"].items():
                if k not in allowed_stats:
                    errors.append(f"Invalid stat key in stats: '{k}'")
                elif not isinstance(v, (int, float)):
                    errors.append(f"Stat '{k}' must be a number, got {type(v).__name__}")

    # Validate leader_bonus
    if "leader_bonus" in data and data["leader_bonus"] is not None:
        if not isinstance(data["leader_bonus"], dict):
            errors.append("Field 'leader_bonus' must be an object")
        else:
            if "text" not in data["leader_bonus"]:
                errors.append("Field 'leader_bonus' must contain key 'text'")
            elif not isinstance(data["leader_bonus"]["text"], str):
                errors.append("Field 'leader_bonus.text' must be a string")
            
            if "scope" in data["leader_bonus"] and data["leader_bonus"]["scope"] is not None:
                if not isinstance(data["leader_bonus"]["scope"], str):
                    errors.append("Field 'leader_bonus.scope' must be a string")

    # Validate ascension bonuses
    if "ascension_bonuses" in data and data["ascension_bonuses"] is not None:
        if not isinstance(data["ascension_bonuses"], list):
            errors.append("Field 'ascension_bonuses' must be a list")
        else:
            for i, ab in enumerate(data["ascension_bonuses"]):
                if not isinstance(ab, dict):
                    errors.append(f"Ascension bonus at index {i} must be an object")
                else:
                    if "tier" not in ab or "bonus" not in ab:
                        errors.append(f"Ascension bonus at index {i} must contain 'tier' and 'bonus'")
                    else:
                        if not isinstance(ab["tier"], int) or not (1 <= ab["tier"] <= 6):
                            errors.append(f"Ascension bonus at index {i} 'tier' must be an integer between 1 and 6")
                        if not isinstance(ab["bonus"], str):
                            errors.append(f"Ascension bonus at index {i} 'bonus' must be a string")

    # Validate awakening bonuses
    if "awakening_bonuses" in data and data["awakening_bonuses"] is not None:
        if not isinstance(data["awakening_bonuses"], list):
            errors.append("Field 'awakening_bonuses' must be a list")
        else:
            for i, ab in enumerate(data["awakening_bonuses"]):
                if not isinstance(ab, dict):
                    errors.append(f"Awakening bonus at index {i} must be an object")
                else:
                    if "tier" not in ab or "bonus" not in ab:
                        errors.append(f"Awakening bonus at index {i} must contain 'tier' and 'bonus'")
                    else:
                        if not isinstance(ab["tier"], int) or not (1 <= ab["tier"] <= 5):
                            errors.append(f"Awakening bonus at index {i} 'tier' must be an integer between 1 and 5")
                        if not isinstance(ab["bonus"], str):
                            errors.append(f"Awakening bonus at index {i} 'bonus' must be a string")

    # Validate skills
    if not isinstance(data["skills"], list):
        errors.append("Field 'skills' must be a list")
    else:
        for i, s in enumerate(data["skills"]):
            if not isinstance(s, dict):
                errors.append(f"Skill at index {i} must be an object")
            else:
                if "name" not in s or "skill_type" not in s:
                    errors.append(f"Skill at index {i} must contain 'name' and 'skill_type'")
                else:
                    if not isinstance(s["name"], str):
                        errors.append(f"Skill at index {i} 'name' must be a string")
                    if s["skill_type"] not in ["Basic", "Core", "Ultimate", "Passive"]:
                        errors.append(f"Skill at index {i} 'skill_type' must be one of Basic, Core, Ultimate, Passive, got '{s['skill_type']}'")
                    
                    # Optional skill fields
                    for sf in ["slug", "description", "image_url", "scaling_formula", "awakening_bonus"]:
                        if sf in s and s[sf] is not None and not isinstance(s[sf], str):
                            errors.append(f"Skill '{s['name']}' field '{sf}' must be a string")
                            
                    for sf in ["ultimate_cost", "initial_divinity", "awakening_level"]:
                        if sf in s and s[sf] is not None and not isinstance(s[sf], int):
                            errors.append(f"Skill '{s['name']}' field '{sf}' must be an integer")
                            
                    if "effects" in s and s["effects"] is not None:
                        if not isinstance(s["effects"], list):
                            errors.append(f"Skill '{s['name']}' field 'effects' must be a list")
                        else:
                            for j, eff in enumerate(s["effects"]):
                                if not isinstance(eff, str):
                                    errors.append(f"Skill '{s['name']}' effect at index {j} must be a string")
                                    
    return errors

def main():
    if not os.path.exists(HEROES_DIR):
        print(f"Error: Heroes directory not found at {HEROES_DIR}")
        sys.exit(1)
        
    files = [f for f in os.listdir(HEROES_DIR) if f.endswith(".json")]
    print(f"Found {len(files)} hero profiles to validate.")
    
    total_errors = 0
    validated_count = 0
    
    for filename in files:
        filepath = os.path.join(HEROES_DIR, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as jde:
            print(f"[FAIL] {filename}: Invalid JSON format - {str(jde)}")
            total_errors += 1
            continue
        except Exception as e:
            print(f"[FAIL] {filename}: Error reading file - {str(e)}")
            total_errors += 1
            continue
            
        errors = validate_hero(data, filename)
        if errors:
            print(f"[FAIL] {filename}:")
            for err in errors:
                print(f"  - {err}")
            total_errors += len(errors)
        else:
            validated_count += 1
            
    print("\n--- Validation Summary ---")
    print(f"Total files processed: {len(files)}")
    print(f"Successfully validated: {validated_count}")
    print(f"Total errors found: {total_errors}")
    
    if total_errors > 0:
        sys.exit(1)
    else:
        print("All profiles validated successfully!")
        sys.exit(0)

if __name__ == "__main__":
    main()
