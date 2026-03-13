import os, json

# Map folder names to anime display names
folder_to_anime = {
    "dragonball": "Dragon Ball",
    "naruto": "Naruto",
    "onepiece": "One Piece",
    "bleach": "Bleach"
}

image_extensions = (".jpg", ".jpeg", ".png", ".webp")
characters = []

for folder, anime_name in folder_to_anime.items():
    folder_path = os.path.join("images", folder)
    if not os.path.exists(folder_path):
        continue
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(image_extensions):
            name = os.path.splitext(filename)[0]          # filename without extension
            name = name.replace("-", " ").replace("_", " ").title()
            img_path = "images/" + folder + "/" + filename
            characters.append({
                "img": img_path,
                "name": name,
                "anime": anime_name
            })

with open("characters.json", "w", encoding="utf-8") as f:
    json.dump(characters, f, indent=2, ensure_ascii=False)

print(f"Done! Generated {len(characters)} characters.")
for c in characters:
    print(" ", c["name"], "->", c["img"])