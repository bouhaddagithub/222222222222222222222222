import os, json, re

# Map folder names to anime display names
folder_to_anime = {
    "dragonball": "Dragon Ball",
    "naruto": "Naruto",
    "onepiece": "One Piece",
    "bleach": "Bleach"
}

image_extensions = (".jpg", ".jpeg", ".png", ".webp")

def get_base_name(filename):
    name = os.path.splitext(filename)[0]
    name = re.sub(r'[\s_-]*\d+$', '', name)
    return name.strip().lower()

def display_name(base):
    return base.replace("-", " ").replace("_", " ").title()

# ── LOAD existing characters.json ────────────────────────────────
with open("characters.json", "r", encoding="utf-8") as f:
    characters = json.load(f)

# Build a lookup: lowercase first name -> index in characters list
name_lookup = {}
for i, char in enumerate(characters):
    key = char["names"][0].lower()
    name_lookup[key] = i

# ── SCAN extra_images folder ──────────────────────────────────────
extra_root = "extra_images"

if not os.path.exists(extra_root):
    print("No 'extra_images' folder found. Create it and add subfolders like 'extra_images/dragonball/goku2.jpg'")
    exit()

added = 0
created = 0

for folder in os.listdir(extra_root):
    folder_path = os.path.join(extra_root, folder)
    if not os.path.isdir(folder_path):
        continue

    anime_name = folder_to_anime.get(folder.lower(), folder.title())

    for filename in sorted(os.listdir(folder_path)):
        if not filename.lower().endswith(image_extensions):
            continue

        base = get_base_name(filename)
        img_path = "extra_images/" + folder + "/" + filename

        if base in name_lookup:
            # Character exists — add image if not already in list
            idx = name_lookup[base]
            if img_path not in characters[idx]["imgs"]:
                characters[idx]["imgs"].append(img_path)
                print(f"  Added image to '{characters[idx]['names'][0]}': {img_path}")
                added += 1
            else:
                print(f"  Already exists, skipped: {img_path}")

        else:
            # Character doesn't exist — create new entry
            new_char = {
                "imgs": [img_path],
                "names": [display_name(base)],
                "anime": anime_name
            }
            characters.append(new_char)
            name_lookup[base] = len(characters) - 1
            print(f"  Created new character '{display_name(base)}': {img_path}")
            created += 1

# ── SAVE back to characters.json ─────────────────────────────────
with open("characters.json", "w", encoding="utf-8") as f:
    json.dump(characters, f, indent=2, ensure_ascii=False)

print(f"\nDone! {added} image(s) added to existing characters, {created} new character(s) created.")
