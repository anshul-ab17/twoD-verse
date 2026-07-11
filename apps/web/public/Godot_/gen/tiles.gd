extends Object
# 32x32 seamless tiles, one draw_<name>() each. Themed via palette like furniture.

const U = preload("res://gen/util.gd")

const TILES := ["floor_wood", "floor_soft", "wall", "wall_base"]

static func draw_floor_wood(img: Image, t: Dictionary, rng: RandomNumberGenerator) -> void:
	img.fill(t.wood)
	for row in 4:
		var y := row * 8
		img.fill_rect(Rect2i(0, y, 32, 1), t.wood_dark)              # plank seam
		img.fill_rect(Rect2i((row % 2) * 16 + 8, y + 1, 1, 7), t.wood_dark)  # end joint
		for i in 3:
			img.fill_rect(Rect2i(rng.randi_range(0, 29), y + rng.randi_range(2, 6), 2, 1), t.wood.lightened(0.08))

static func draw_floor_soft(img: Image, t: Dictionary, rng: RandomNumberGenerator) -> void:
	img.fill(t.fabric)
	for y in range(0, 32, 4):
		for x in range(0, 32, 4):
			img.fill_rect(Rect2i(x + (y / 4 % 2) * 2, y, 1, 1), t.fabric_dark)  # weave dither
	for i in 4:
		img.fill_rect(Rect2i(rng.randi_range(0, 30), rng.randi_range(0, 31), 2, 1), t.fabric.lightened(0.08))

static func draw_wall(img: Image, t: Dictionary, rng: RandomNumberGenerator) -> void:
	var base: Color = t.wood.lerp(t.white, 0.6)
	img.fill(base)
	for i in 5:
		img.fill_rect(Rect2i(rng.randi_range(0, 30), rng.randi_range(0, 31), 2, 1), base.darkened(0.05))
	img.fill_rect(Rect2i(0, 30, 32, 2), base.darkened(0.12))         # bottom shade

static func draw_wall_base(img: Image, t: Dictionary, rng: RandomNumberGenerator) -> void:
	draw_wall(img, t, rng)
	img.fill_rect(Rect2i(0, 24, 32, 1), t.outline)                   # baseboard
	img.fill_rect(Rect2i(0, 25, 32, 7), t.wood_dark)
	img.fill_rect(Rect2i(0, 25, 32, 1), t.wood)
