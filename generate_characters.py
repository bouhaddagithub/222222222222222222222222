import os, json, re

folder_to_anime = {
    "dragonball": "Dragon Ball",
    "naruto": "Naruto",
    "onepiece": "One Piece",
    "bleach": "Bleach"
}

image_extensions = (".jpg", ".jpeg", ".png", ".webp")

def get_base_name(filename):
    # strips trailing numbers: "goku1.jpg" -> "goku", "goku_2.jpg" -> "goku"
    name = os.path.splitext(filename)[0]
    name = re.sub(r'[\s_-]*\d+$', '', name)
    return name.strip()

characters = []

for folder, anime_name in folder_to_anime.items():
    
    folder_path = os.path.join("images", folder)
    if not os.path.exists(folder_path):
        continue

    # group files by base character name
    groups = {}
    for filename in sorted(os.listdir(folder_path)):
        if filename.lower().endswith(image_extensions):
            base = get_base_name(filename)
            if base not in groups:
                groups[base] = []
            groups[base].append("images/" + folder + "/" + filename)

    for base_name, imgs in groups.items():
        display_name = base_name.replace("-", " ").replace("_", " ").title()
        characters.append({
            "imgs": imgs,
            "names": [display_name],
            "anime": anime_name
        })

with open("characters.json", "w", encoding="utf-8") as f:
    json.dump(characters, f, indent=2, ensure_ascii=False)

print(f"Done! {len(characters)} characters.")
for c in characters:
    print(f"  {c['names'][0]} -> {len(c['imgs'])} image(s)")