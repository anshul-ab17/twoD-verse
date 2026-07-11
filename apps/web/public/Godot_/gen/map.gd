extends Object
# Renders a composite room preview image (10x8 tiles @ 32px = 320x256 px).
# Wall tiles: rows 0-1. Wall_base: row 2. Floor_wood: rows 3-7.
# Furniture blended back-to-front; all rects verified non-overlapping.

const ROOM_W := 10
const ROOM_H := 8
const T := 32

# [item, pixel_x, pixel_y]. Floor starts y=96 (row 3).
# Overlap verification (x1-x2, y1-y2):
#   wall zone: painting(116-147,8-39)  window(56-103,4-51)  whiteboard(156-219,0-47)
#              wall_clock(236-267,8-39) bookshelf(0-47,28-91) door(268-315,28-91) — all clear
#   back row:  desk(4-67,96-143) water_cooler(72-103,96-151) meeting_table(112-207,96-159)
#              plant(248-279,96-143) floor_lamp(284-315,96-159) — all clear
#   mid row:   chair(8-39,152-191) coffee_machine(72-103,152-191) trash_bin(108-131,164-195)
#              rug(160-223,152-199) sofa(160-223,160-199) — all clear
#   bot row:   koi_pond(8-103,192-255) pet_bed(112-159,208-239) bonsai_a(232-263,208-239)
#              fridge(288-319,192-255) — all clear
const LAYOUT := [
	# wall zone
	["painting",    116,  8],
	["window",       56,  4],
	["whiteboard",  156,  0],
	["wall_clock",  236,  8],
	["bookshelf",     0, 28],
	["door",        268, 28],
	# back floor row
	["desk",          4, 96],
	["water_cooler", 72, 96],
	["meeting_table",112, 96],
	["plant",       248, 96],
	["floor_lamp",  284, 96],
	# mid floor row
	["chair",         8, 152],
	["coffee_machine",72, 152],
	["trash_bin",   108, 164],
	["rug",         160, 152],
	["sofa",        160, 160],
	# bottom floor row
	["koi_pond",      8, 192],
	["pet_bed",     112, 208],
	["bonsai_a",    232, 208],
	["fridge",      288, 192],
]

static func render(tiles: Dictionary, furn: Dictionary) -> Image:
	var img := Image.create_empty(ROOM_W * T, ROOM_H * T, false, Image.FORMAT_RGBA8)
	for row in ROOM_H:
		var tile_name: String
		if row < 2:
			tile_name = "wall"
		elif row == 2:
			tile_name = "wall_base"
		else:
			tile_name = "floor_wood"
		var tile: Image = tiles[tile_name]
		for col in ROOM_W:
			img.blit_rect(tile, Rect2i(0, 0, T, T), Vector2i(col * T, row * T))
	for entry in LAYOUT:
		var item: String = entry[0]
		var px: int = entry[1]
		var py: int = entry[2]
		if not furn.has(item):
			continue
		var fi: Image = furn[item]
		img.blend_rect(fi, Rect2i(0, 0, fi.get_width(), fi.get_height()), Vector2i(px, py))
	return img
