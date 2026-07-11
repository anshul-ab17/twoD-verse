# Slice character sprites out of the AI reference sheets.
# Background = near-black connected to image border -> alpha 0.
import os
from collections import deque
from PIL import Image

ROOT = r"C:\Users\atuly\Downloads\Godot_"
OUT = os.path.join(ROOT, "assets", "characters")

def bg_mask(im, thresh=28):
    w, h = im.size
    px = im.load()
    bg = bytearray(w * h)
    q = deque()
    def dark(x, y):
        r, g, b = px[x, y][:3]
        return r < thresh and g < thresh and b < thresh
    for x in range(w):
        for y in (0, h - 1):
            if dark(x, y) and not bg[y * w + x]:
                bg[y * w + x] = 1; q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if dark(x, y) and not bg[y * w + x]:
                bg[y * w + x] = 1; q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny * w + nx] and dark(nx, ny):
                bg[ny * w + nx] = 1; q.append((nx, ny))
    return bg

def y_bands(bg, w, h, x0, x1, min_h=60):
    rows = [any(not bg[y * w + x] for x in range(x0, x1)) for y in range(h)]
    bands, start = [], None
    for y in range(h):
        if rows[y] and start is None:
            start = y
        elif not rows[y] and start is not None:
            if y - start >= min_h:
                bands.append((start, y))
            start = None
    if start is not None and h - start >= min_h:
        bands.append((start, h))
    return bands

def x_segments(bg, w, x0, x1, y0, y1, gap=3, min_w=20):
    # a column counts as empty if it has almost no foreground (tolerates
    # sword tips / fingertips bridging adjacent frames)
    cols = [sum(1 for y in range(y0, y1) if not bg[y * w + x]) > 3 for x in range(x0, x1)]
    segs, start, empty = [], None, 0
    for i, c in enumerate(cols):
        if c:
            if start is None:
                start = i
            empty = 0
        elif start is not None:
            empty += 1
            if empty >= gap:
                if i - empty - start + 1 >= min_w:
                    segs.append((x0 + start, x0 + i - empty + 1))
                start = None; empty = 0
    if start is not None and x1 - x0 - start >= min_w:
        segs.append((x0 + start, x1))
    return segs

def crop_frame(im, bg, w, sx0, sx1, y0, y1):
    px = im.load()
    minx, maxx, miny, maxy = None, None, None, None
    n_fg = n_white = 0
    for y in range(y0, y1):
        for x in range(sx0, sx1):
            if not bg[y * w + x]:
                n_fg += 1
                r, g, b = px[x, y][:3]
                if r > 200 and g > 200 and b > 200:
                    n_white += 1
                minx = x if minx is None else min(minx, x)
                maxx = x if maxx is None else max(maxx, x)
                miny = y if miny is None else min(miny, y)
                maxy = y if maxy is None else max(maxy, y)
    if minx is None or n_fg < 500:
        return None
    if n_white / n_fg > 0.5:   # speech bubble / text
        return None
    fr = Image.new("RGBA", (maxx - minx + 1, maxy - miny + 1), (0, 0, 0, 0))
    fp = fr.load()
    for y in range(miny, maxy + 1):
        for x in range(minx, maxx + 1):
            if not bg[y * w + x]:
                fp[x - minx, y - miny] = px[x, y][:3] + (255,)
    return fr

def pack(frames):
    cw = max(f.width for f in frames)
    ch = max(f.height for f in frames)
    sheet = Image.new("RGBA", (cw * len(frames), ch), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(f, (i * cw + (cw - f.width) // 2, ch - f.height))
    return sheet

def extract(path, columns):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    bg = bg_mask(im)
    for name, x0, x1 in columns:
        bands = y_bands(bg, w, h, x0, x1)
        labels = ["walk", "hello"]
        for bi, (y0, y1) in enumerate(bands[:2]):
            frames = []
            for sx0, sx1 in x_segments(bg, w, x0, x1, y0, y1):
                f = crop_frame(im, bg, w, sx0, sx1, y0, y1)
                if f:
                    frames.append(f)
            if not frames:
                continue
            suffix = "" if labels[bi] == "walk" else "_hello"
            out = os.path.join(OUT, f"{name}{suffix}.png")
            pack(frames).save(out)
            print(f"{name}{suffix}: {len(frames)} frames -> {out}")

os.makedirs(OUT, exist_ok=True)
extract(os.path.join(ROOT, "one piece.png"), [
    ("nami", 0, 395), ("zoro", 396, 768), ("sanji", 769, 1152), ("luffy", 1153, 1536),
])
extract(os.path.join(ROOT, "one piece.png"), [])  # noop placeholder
extract(os.path.join(ROOT, "64e5d9a5-394c-46af-bc17-b18895e552c2 (1).png"), [
    ("robin", 0, 1536),
])
# row 2 of the crew sheet shares columns with row 1; y_bands returns all bands per column,
# so re-run with band offset handled by taking bands 2..3 as the second character set.
def extract_row2(path, columns):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    bg = bg_mask(im)
    for name, x0, x1 in columns:
        bands = y_bands(bg, w, h, x0, x1)
        labels = ["walk", "hello"]
        for bi, (y0, y1) in enumerate(bands[2:4]):
            frames = []
            for sx0, sx1 in x_segments(bg, w, x0, x1, y0, y1):
                f = crop_frame(im, bg, w, sx0, sx1, y0, y1)
                if f:
                    frames.append(f)
            if not frames:
                continue
            suffix = "" if labels[bi] == "walk" else "_hello"
            out = os.path.join(OUT, f"{name}{suffix}.png")
            pack(frames).save(out)
            print(f"{name}{suffix}: {len(frames)} frames -> {out}")

extract_row2(os.path.join(ROOT, "one piece.png"), [
    ("chopper", 0, 395), ("brook", 396, 768), ("franky", 769, 1152), ("usopp", 1153, 1536),
])
print("done")
