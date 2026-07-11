"""Make <name>_sit.png from walk sheets: frame 0, cropped at hips.

Cozy-game sitting cheat: the sprite keeps head->hips; the chair/sofa/table
front hides the legs. Place the sprite so its BOTTOM edge sits on the seat
line of the furniture (see docs/ASSETS.md "Sitting").

Run:  python gen/make_sit.py   (needs Pillow)
"""
from PIL import Image
import os

# name: walk frame count (from docs/ASSETS.md)
SHEETS = {
    "luffy": 5, "zoro": 5, "nami": 6, "sanji": 5,
    "robin": 6, "brook": 5, "usopp": 5, "chopper": 5,
}
HIP = 0.62  # keep top 62% of the visible body (head -> hips)
DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "characters")

for name, frames in SHEETS.items():
    sheet = Image.open(os.path.join(DIR, name + ".png")).convert("RGBA")
    cw = sheet.width // frames
    frame = sheet.crop((0, 0, cw, sheet.height))
    bbox = frame.getbbox()  # alpha-aware bounds of the body
    l, t, r, b = bbox
    hip_y = t + int((b - t) * HIP)
    sit = frame.crop((l, t, r, hip_y))
    sit.save(os.path.join(DIR, name + "_sit.png"))
    print(f"{name}_sit.png  {sit.width}x{sit.height}")
