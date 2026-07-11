extends Object
# One draw_<item>() per furniture piece. All take (img, theme_dict, rng).
# Sizes in ITEMS. Themed via palette + t.rounded.

const U = preload("res://gen/util.gd")

const ITEMS := {
	desk = Vector2i(64, 48),
	pc = Vector2i(32, 40),
	laptop = Vector2i(32, 24),
	bookshelf = Vector2i(48, 64),
	koi_pond = Vector2i(96, 64),
	bonsai_a = Vector2i(32, 32),
	bonsai_b = Vector2i(32, 32),
	bonsai_c = Vector2i(32, 32),
	fridge = Vector2i(32, 64),
	meeting_table = Vector2i(96, 64),
	sofa = Vector2i(64, 40),
	projector = Vector2i(40, 24),
	projector_screen = Vector2i(64, 48),
	coffee_machine = Vector2i(32, 40),
	whiteboard = Vector2i(64, 48),
	water_cooler = Vector2i(32, 56),
	rug = Vector2i(64, 48),
	floor_lamp = Vector2i(32, 64),
	plant = Vector2i(32, 48),
	wall_clock = Vector2i(32, 32),
	chair = Vector2i(32, 40),
	door = Vector2i(48, 64),
	window = Vector2i(48, 48),
	painting = Vector2i(32, 32),
	trash_bin = Vector2i(24, 32),
	pet_bed = Vector2i(48, 32),
}

static func draw_chair(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	var cut := 2 if t.rounded else 0
	U.rrect(img, Rect2i(8, 2, 16, 16), cut, t.fabric, t.outline)     # back
	img.fill_rect(Rect2i(10, 4, 12, 2), t.fabric.lightened(0.15))
	U.orect(img, Rect2i(6, 18, 20, 7), t.fabric_dark, t.outline)     # seat
	img.fill_rect(Rect2i(14, 25, 4, 8), t.metal_dark)                # pole
	U.orect(img, Rect2i(7, 33, 18, 3), t.metal, t.outline)           # base
	img.fill_rect(Rect2i(7, 36, 3, 2), t.metal_dark)                 # casters
	img.fill_rect(Rect2i(22, 36, 3, 2), t.metal_dark)

static func draw_door(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(2, 2, 44, 62), t.wood_dark, t.outline)       # frame
	U.orect(img, Rect2i(7, 7, 34, 57), t.wood, t.outline)            # door
	img.fill_rect(Rect2i(11, 12, 26, 20), t.wood_dark)               # top panel
	img.fill_rect(Rect2i(12, 13, 24, 18), t.wood.darkened(0.08))
	img.fill_rect(Rect2i(11, 38, 26, 20), t.wood_dark)               # bottom panel
	img.fill_rect(Rect2i(12, 39, 24, 18), t.wood.darkened(0.08))
	U.oellipse(img, 35, 35, 2, 2, t.metal, t.outline)                # knob

static func draw_window(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(2, 2, 44, 44), t.wood, t.outline)            # frame
	U.orect(img, Rect2i(7, 7, 34, 34), t.screen, t.outline)          # glass (sky)
	img.fill_rect(Rect2i(8, 8, 32, 10), t.screen.lightened(0.15))    # sky gradient
	U.ellipse(img, 16, 14, 6, 3, t.white)                            # cloud
	U.ellipse(img, 30, 22, 5, 2, t.white)
	img.fill_rect(Rect2i(23, 7, 2, 34), t.wood)                      # cross bars
	img.fill_rect(Rect2i(7, 23, 34, 2), t.wood)
	img.fill_rect(Rect2i(4, 46, 40, 2), t.wood_dark)                 # sill

static func draw_painting(img: Image, t: Dictionary, rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(3, 3, 26, 22), t.wood_dark, t.outline)       # frame
	img.fill_rect(Rect2i(6, 6, 20, 16), t.screen)                    # sky
	img.fill_rect(Rect2i(6, 15, 20, 7), t.leaf)                      # hills
	U.ellipse(img, 12 + rng.randi_range(0, 8), 15, 5, 3, t.leaf_dark)
	U.ellipse(img, 21, 10, 2, 2, t.glow)                             # sun
	img.fill_rect(Rect2i(14, 26, 4, 2), t.outline)                   # hook shadow

static func draw_trash_bin(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(5, 8, 14, 21), t.metal, t.outline)
	img.fill_rect(Rect2i(7, 10, 2, 17), t.metal.lightened(0.15))
	img.fill_rect(Rect2i(15, 10, 2, 17), t.metal_dark)
	U.orect(img, Rect2i(3, 5, 18, 3), t.metal_dark, t.outline)       # rim
	img.fill_rect(Rect2i(8, 2, 8, 3), t.white)                       # crumpled paper
	img.fill_rect(Rect2i(9, 2, 2, 1), t.outline)

static func draw_pet_bed(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.oellipse(img, 24, 18, 22, 12, t.terracotta, t.outline)         # basket
	U.oellipse(img, 24, 20, 17, 8, t.terracotta_dark, t.outline)     # inner wall
	U.oellipse(img, 24, 21, 14, 6, t.fabric, t.outline)              # cushion
	U.ellipse(img, 21, 20, 7, 3, t.fabric.lightened(0.15))           # cushion sheen

static func draw_desk(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(6, 26, 4, 18), t.wood_dark, t.outline)   # left leg
	U.orect(img, Rect2i(38, 26, 20, 18), t.wood_dark, t.outline) # drawer block
	img.fill_rect(Rect2i(40, 30, 16, 1), t.outline)              # drawer split
	img.fill_rect(Rect2i(40, 37, 16, 1), t.outline)
	img.fill_rect(Rect2i(47, 27, 2, 2), t.metal)                 # knobs
	img.fill_rect(Rect2i(47, 33, 2, 2), t.metal)
	U.orect(img, Rect2i(4, 18, 56, 8), t.wood, t.outline)        # top
	img.fill_rect(Rect2i(5, 19, 54, 2), t.wood.lightened(0.15))  # top highlight

static func draw_pc(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(4, 4, 24, 16), t.metal_dark, t.outline)  # monitor frame
	img.fill_rect(Rect2i(6, 6, 20, 12), t.screen)
	img.fill_rect(Rect2i(8, 8, 12, 2), t.white)                  # screen shine
	img.fill_rect(Rect2i(8, 12, 8, 1), t.screen_dark)
	img.fill_rect(Rect2i(14, 21, 4, 3), t.metal_dark)            # stand
	U.orect(img, Rect2i(9, 24, 14, 2), t.metal_dark, t.outline)  # base
	U.orect(img, Rect2i(6, 31, 20, 5), t.metal, t.outline)       # keyboard
	for i in 6:
		img.fill_rect(Rect2i(8 + i * 3, 33, 2, 1), t.metal_dark)

static func draw_laptop(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(6, 2, 20, 12), t.metal_dark, t.outline)  # lid
	img.fill_rect(Rect2i(8, 4, 16, 8), t.screen)
	img.fill_rect(Rect2i(9, 5, 10, 2), t.white)
	U.orect(img, Rect2i(4, 15, 24, 6), t.metal, t.outline)       # base
	for i in 7:
		img.fill_rect(Rect2i(6 + i * 3, 17, 2, 1), t.metal_dark)
	img.fill_rect(Rect2i(13, 19, 6, 1), t.metal_dark)            # trackpad

static func draw_bookshelf(img: Image, t: Dictionary, rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(2, 2, 44, 60), t.wood, t.outline)
	img.fill_rect(Rect2i(5, 5, 38, 54), t.wood_dark)
	var spines := [t.accent, t.fabric, t.red, t.blue, t.leaf, t.terracotta, t.white]
	for shelf in 3:
		var sy := 20 + shelf * 16
		img.fill_rect(Rect2i(5, sy, 38, 3), t.wood)              # shelf board
		var x := 6
		while x < 40:
			var w := rng.randi_range(2, 4)
			var h := rng.randi_range(9, 12)
			if x + w > 42:
				break
			img.fill_rect(Rect2i(x, sy - h, w, h), spines[rng.randi_range(0, spines.size() - 1)])
			img.fill_rect(Rect2i(x, sy - h, w, 1), t.outline)
			x += w + 1
	# top row of books
	var x2 := 6
	while x2 < 38:
		var w2 := rng.randi_range(2, 4)
		img.fill_rect(Rect2i(x2, 8, w2, 11), spines[rng.randi_range(0, spines.size() - 1)])
		x2 += w2 + 1

static func draw_koi_pond(img: Image, t: Dictionary, rng: RandomNumberGenerator) -> void:
	U.oellipse(img, 48, 32, 44, 26, t.stone, t.outline)
	U.ellipse(img, 48, 34, 42, 22, t.stone_dark)                 # stone inner shade
	U.oellipse(img, 48, 32, 38, 20, t.water, t.outline)
	img.fill_rect(Rect2i(24, 24, 20, 2), t.white * Color(1, 1, 1, 0.5))  # ripple shine
	img.fill_rect(Rect2i(50, 40, 14, 1), t.water_dark)
	# koi: body + tail
	for k in 3:
		var kx := rng.randi_range(24, 62)
		var ky := rng.randi_range(24, 38)
		var col: Color = t.koi if k < 2 else t.white
		U.orect(img, Rect2i(kx, ky, 8, 4), col, t.outline)
		img.fill_rect(Rect2i(kx + 8, ky + 1, 3, 2), col)         # tail
		img.fill_rect(Rect2i(kx + 2, ky + 1, 2, 2), t.white if k < 2 else t.koi)
	# lily pads
	U.oellipse(img, 30, 40, 5, 3, t.leaf, t.outline)
	U.oellipse(img, 66, 22, 4, 2, t.leaf_light, t.outline)

static func _bonsai_base(img: Image, t: Dictionary, pot_col: Color) -> void:
	U.orect(img, Rect2i(8, 25, 16, 5), pot_col, t.outline)
	img.fill_rect(Rect2i(10, 24, 12, 1), t.outline)              # pot rim
	img.fill_rect(Rect2i(14, 18, 3, 7), t.trunk)                 # trunk
	img.fill_rect(Rect2i(14, 18, 1, 7), t.outline)

static func draw_bonsai_a(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	_bonsai_base(img, t, t.terracotta)
	U.oellipse(img, 15, 12, 10, 6, t.leaf, t.outline)
	U.ellipse(img, 12, 10, 5, 3, t.leaf_light)

static func draw_bonsai_b(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	_bonsai_base(img, t, t.accent)
	img.fill_rect(Rect2i(12, 14, 2, 5), t.trunk)                 # side branch
	U.oellipse(img, 10, 12, 6, 4, t.leaf_dark, t.outline)
	U.oellipse(img, 20, 9, 7, 4, t.leaf, t.outline)
	U.ellipse(img, 21, 8, 3, 2, t.leaf_light)

static func draw_bonsai_c(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	_bonsai_base(img, t, t.stone_dark)
	# cascading style: three small tiers
	U.oellipse(img, 15, 6, 6, 3, t.leaf, t.outline)
	U.oellipse(img, 10, 12, 5, 3, t.leaf_dark, t.outline)
	U.oellipse(img, 21, 15, 5, 3, t.leaf_light, t.outline)

static func draw_fridge(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(4, 4, 24, 55), t.metal, t.outline)
	img.fill_rect(Rect2i(4, 4, 24, 2), t.metal.lightened(0.2))
	img.fill_rect(Rect2i(4, 26, 24, 1), t.outline)               # door split
	img.fill_rect(Rect2i(23, 10, 2, 12), t.metal_dark)           # handles
	img.fill_rect(Rect2i(23, 30, 2, 12), t.metal_dark)
	img.fill_rect(Rect2i(6, 59, 4, 2), t.outline)                # feet
	img.fill_rect(Rect2i(22, 59, 4, 2), t.outline)

static func draw_meeting_table(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.ellipse(img, 48, 36, 42, 20, t.outline)                    # shadow/base
	U.orect(img, Rect2i(16, 34, 6, 16), t.wood_dark, t.outline)  # legs
	U.orect(img, Rect2i(74, 34, 6, 16), t.wood_dark, t.outline)
	U.oellipse(img, 48, 26, 42, 18, t.wood, t.outline)
	U.ellipse(img, 44, 22, 30, 10, t.wood.lightened(0.12))       # sheen

static func draw_sofa(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	var cut := 3 if t.rounded else 0
	U.rrect(img, Rect2i(4, 6, 56, 16), cut, t.fabric, t.outline)         # back
	U.rrect(img, Rect2i(2, 14, 10, 20), cut, t.fabric_dark, t.outline)   # arms
	U.rrect(img, Rect2i(52, 14, 10, 20), cut, t.fabric_dark, t.outline)
	U.orect(img, Rect2i(11, 22, 42, 12), t.fabric, t.outline)            # seat
	img.fill_rect(Rect2i(32, 23, 1, 10), t.fabric_dark)                  # cushion split
	img.fill_rect(Rect2i(12, 23, 40, 2), t.fabric.lightened(0.15))
	img.fill_rect(Rect2i(6, 35, 3, 3), t.wood_dark)                      # legs
	img.fill_rect(Rect2i(55, 35, 3, 3), t.wood_dark)

static func draw_projector(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(4, 6, 28, 12), t.metal, t.outline)
	for i in 4:
		img.fill_rect(Rect2i(7 + i * 4, 9, 2, 6), t.metal_dark)  # vents
	U.oellipse(img, 33, 12, 4, 4, t.metal_dark, t.outline)       # lens housing
	U.ellipse(img, 33, 12, 2, 2, t.glow)                         # lens
	img.fill_rect(Rect2i(7, 19, 3, 2), t.outline)                # feet
	img.fill_rect(Rect2i(26, 19, 3, 2), t.outline)

static func draw_projector_screen(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(2, 2, 60, 5), t.metal_dark, t.outline)   # top case
	U.orect(img, Rect2i(8, 8, 48, 34), t.white, t.outline)       # screen
	img.fill_rect(Rect2i(9, 9, 46, 3), t.white.darkened(0.06))
	U.orect(img, Rect2i(26, 43, 12, 3), t.metal_dark, t.outline) # pull bar

static func draw_coffee_machine(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(6, 4, 20, 28), t.metal_dark, t.outline)
	img.fill_rect(Rect2i(8, 6, 16, 4), t.metal)                  # top panel
	img.fill_rect(Rect2i(20, 7, 2, 2), t.accent)                 # button
	img.fill_rect(Rect2i(10, 14, 12, 5), t.outline)              # brew alcove
	img.fill_rect(Rect2i(14, 14, 4, 2), t.metal)                 # spout
	U.orect(img, Rect2i(13, 22, 6, 5), t.white, t.outline)       # cup
	img.fill_rect(Rect2i(14, 23, 4, 1), t.coffee)
	U.orect(img, Rect2i(8, 32, 16, 3), t.metal, t.outline)       # drip tray

static func draw_whiteboard(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(4, 4, 56, 34), t.metal, t.outline)       # frame
	img.fill_rect(Rect2i(7, 7, 50, 28), t.white)
	img.fill_rect(Rect2i(11, 12, 24, 2), t.blue)                 # scribbles
	img.fill_rect(Rect2i(11, 17, 34, 2), t.blue)
	img.fill_rect(Rect2i(11, 22, 18, 2), t.red)
	U.oellipse(img, 46, 24, 6, 5, Color(0, 0, 0, 0), t.accent_dark)  # circled note
	U.orect(img, Rect2i(20, 38, 24, 3), t.metal_dark, t.outline) # marker tray
	img.fill_rect(Rect2i(24, 37, 6, 1), t.red)                   # markers
	img.fill_rect(Rect2i(32, 37, 6, 1), t.blue)

static func draw_water_cooler(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(9, 2, 14, 13), t.water, t.outline)       # bottle
	img.fill_rect(Rect2i(11, 4, 3, 8), t.white * Color(1, 1, 1, 0.55))
	U.orect(img, Rect2i(7, 16, 18, 32), t.white, t.outline)      # body
	img.fill_rect(Rect2i(9, 18, 14, 2), t.metal)
	img.fill_rect(Rect2i(10, 28, 3, 3), t.blue)                  # taps
	img.fill_rect(Rect2i(19, 28, 3, 3), t.red)
	img.fill_rect(Rect2i(9, 34, 14, 1), t.metal_dark)            # tray line
	img.fill_rect(Rect2i(9, 48, 4, 2), t.outline)                # feet
	img.fill_rect(Rect2i(19, 48, 4, 2), t.outline)

static func draw_rug(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	var cut := 4 if t.rounded else 2
	U.rrect(img, Rect2i(2, 2, 60, 44), cut, t.fabric, t.outline)
	U.rrect(img, Rect2i(7, 7, 50, 34), cut, t.fabric_dark, t.fabric_dark)
	U.rrect(img, Rect2i(11, 11, 42, 26), cut, t.fabric, t.fabric)
	U.oellipse(img, 32, 24, 8, 5, t.accent, t.accent_dark)       # center medallion
	for corner in [Vector2i(15, 14), Vector2i(48, 14), Vector2i(15, 34), Vector2i(48, 34)]:
		img.fill_rect(Rect2i(corner.x, corner.y, 2, 2), t.accent_dark)

static func draw_floor_lamp(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(10, 58, 12, 4), t.metal_dark, t.outline) # base
	img.fill_rect(Rect2i(15, 20, 2, 38), t.metal_dark)           # pole
	# trapezoid shade, widening downward
	for row in 10:
		var w := 8 + row
		img.fill_rect(Rect2i(16 - w / 2, 6 + row, w, 1), t.accent)
	img.fill_rect(Rect2i(8, 15, 17, 1), t.outline)               # shade rim
	img.fill_rect(Rect2i(12, 5, 9, 1), t.outline)
	img.fill_rect(Rect2i(11, 17, 11, 3), t.glow)                 # light spill

static func draw_plant(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(9, 36, 14, 10), t.terracotta, t.outline)
	img.fill_rect(Rect2i(8, 34, 16, 3), t.terracotta_dark)       # rim
	img.fill_rect(Rect2i(15, 22, 2, 13), t.leaf_dark)            # stems
	img.fill_rect(Rect2i(11, 26, 1, 9), t.leaf_dark)
	img.fill_rect(Rect2i(20, 26, 1, 9), t.leaf_dark)
	U.oellipse(img, 16, 16, 9, 8, t.leaf, t.outline)
	U.oellipse(img, 9, 24, 5, 5, t.leaf_dark, t.outline)
	U.oellipse(img, 23, 23, 5, 5, t.leaf_light, t.outline)

static func draw_wall_clock(img: Image, t: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.oellipse(img, 16, 16, 13, 13, t.metal, t.outline)
	U.ellipse(img, 16, 16, 10, 10, t.white)
	for m in [Vector2i(16, 7), Vector2i(16, 25), Vector2i(7, 16), Vector2i(25, 16)]:
		img.fill_rect(Rect2i(m.x, m.y, 1, 1), t.outline)         # 12/3/6/9 ticks
	img.fill_rect(Rect2i(16, 10, 1, 7), t.outline)               # minute hand
	img.fill_rect(Rect2i(16, 16, 5, 1), t.outline)               # hour hand
	img.fill_rect(Rect2i(15, 15, 2, 2), t.red)                   # hub
