extends Object
# 32x64 avatar frames. Sheet: 4 rows (down, left, right, up) x 4 walk frames = 128x256.

const U = preload("res://gen/util.gd")

const FRAME_W := 32
const FRAME_H := 64

static func make_sheet(p: Dictionary) -> Image:
	var img := Image.create_empty(FRAME_W * 4, FRAME_H * 4, false, Image.FORMAT_RGBA8)
	for dir in 4:
		for frame in 4:
			_draw_frame(img, frame * FRAME_W, dir * FRAME_H, p, dir, frame)
	return img

# dir: 0=down 1=left 2=right 3=up. frame: 0 idle, 1 step, 2 idle, 3 other step.
static func _draw_frame(img: Image, ox: int, oy: int, p: Dictionary, dir: int, frame: int) -> void:
	if p.get("pet", false):
		_draw_pet_frame(img, ox, oy, p, dir, frame)
		return
	var stepping := frame == 1 or frame == 3
	var bob := 1 if stepping else 0
	var y := oy - bob  # head/torso bob up on step frames; legs stay anchored
	var OUT: Color = p.outline

	# legs (anchored to oy). Forward leg lifts 2px.
	var lf := 2 if frame == 1 else 0
	var rf := 2 if frame == 3 else 0
	if p.has("skirt"):
		# heels only; skirt (drawn after torso) covers the legs
		U.orect(img, Rect2i(ox + 10, oy + 55 - lf, 5, 4), p.shoe, OUT)
		U.orect(img, Rect2i(ox + 17, oy + 55 - rf, 5, 4), p.shoe, OUT)
	elif p.get("shorts", false):
		U.orect(img, Rect2i(ox + 11, oy + 44, 4, 6), p.pants, OUT)
		U.orect(img, Rect2i(ox + 17, oy + 44, 4, 6), p.pants, OUT)
		U.orect(img, Rect2i(ox + 11, oy + 49, 4, 7 - lf), p.skin, OUT)
		U.orect(img, Rect2i(ox + 17, oy + 49, 4, 7 - rf), p.skin, OUT)
		U.orect(img, Rect2i(ox + 10, oy + 55 - lf, 6, 4), p.shoe, OUT)
		U.orect(img, Rect2i(ox + 16, oy + 55 - rf, 6, 4), p.shoe, OUT)
	else:
		U.orect(img, Rect2i(ox + 11, oy + 44, 4, 12 - lf), p.pants, OUT)
		U.orect(img, Rect2i(ox + 17, oy + 44, 4, 12 - rf), p.pants, OUT)
		U.orect(img, Rect2i(ox + 10, oy + 55 - lf, 6, 4), p.shoe, OUT)
		U.orect(img, Rect2i(ox + 16, oy + 55 - rf, 6, 4), p.shoe, OUT)

	# torso
	if p.get("midriff", false):
		U.orect(img, Rect2i(ox + 9, y + 26, 14, 10), p.shirt, OUT)
		U.orect(img, Rect2i(ox + 10, y + 36, 12, 9), p.skin, OUT)
	else:
		U.orect(img, Rect2i(ox + 9, y + 26, 14, 19), p.shirt, OUT)
	if p.get("vest", false) and dir != 3:
		img.fill_rect(Rect2i(ox + 14, y + 27, 4, 14), p.skin)  # open vest, bare chest
	if p.has("sash"):
		img.fill_rect(Rect2i(ox + 9, y + 41, 14, 3), p.sash)
	if p.has("haramaki"):
		img.fill_rect(Rect2i(ox + 9, y + 38, 14, 5), p.haramaki)
	if p.has("tie") and dir == 0:
		img.fill_rect(Rect2i(ox + 15, y + 27, 2, 7), p.tie)

	# long skirt over the legs, slight flare on step frames
	if p.has("skirt"):
		var sway := 1 if stepping else 0
		U.orect(img, Rect2i(ox + 8 - sway, y + 40, 16 + sway * 2, 15), p.skirt, OUT)
		img.fill_rect(Rect2i(ox + 8 - sway, y + 52, 16 + sway * 2, 2), p.skirt.lightened(0.3))  # frill
		img.fill_rect(Rect2i(ox + 13, y + 44, 3, 3), p.skirt.lightened(0.35))  # floral hint
		img.fill_rect(Rect2i(ox + 18, y + 48, 2, 2), p.skirt.lightened(0.35))

	# swords at the hip (visible except from behind)
	if p.get("swords", false) and dir != 3:
		var sx := ox + 25 if dir == 2 else ox + 4
		U.orect(img, Rect2i(sx, y + 38, 3, 12), Color8(210, 210, 220), OUT)
		img.fill_rect(Rect2i(sx, y + 35, 3, 4), Color8(70, 56, 90))  # hilt

	# arms
	if dir == 0 or dir == 3:
		var swing_l := 2 if frame == 3 else 0
		var swing_r := 2 if frame == 1 else 0
		U.orect(img, Rect2i(ox + 6, y + 27, 3, 13 - swing_l), p.shirt, OUT)
		U.orect(img, Rect2i(ox + 23, y + 27, 3, 13 - swing_r), p.shirt, OUT)
		img.fill_rect(Rect2i(ox + 6, y + 37 - swing_l, 3, 3), p.skin)
		img.fill_rect(Rect2i(ox + 23, y + 37 - swing_r, 3, 3), p.skin)
	else:
		# side view: one arm at the leading edge, darker so it reads against torso
		var facing_left := dir == 1
		var ax := 10 if facing_left else 18
		var sw := 2 if frame == 1 else (-2 if frame == 3 else 0)
		if not facing_left:
			sw = -sw
		U.orect(img, Rect2i(ox + ax + sw, y + 28, 4, 12), p.shirt.darkened(0.15), OUT)
		img.fill_rect(Rect2i(ox + ax + sw, y + 37, 4, 3), p.skin)

	# head (skin base, then hair, then eyes)
	var style: String = p.get("hair_style", "")
	if style == "long" and dir != 3:
		# hair falls behind shoulders on both sides (up view covers it all below)
		img.fill_rect(Rect2i(ox + 8, y + 12, 2, 20), p.hair)
		img.fill_rect(Rect2i(ox + 22, y + 12, 2, 20), p.hair)
	U.orect(img, Rect2i(ox + 10, y + 10, 12, 15), p.skin, OUT)
	if dir == 3:
		img.fill_rect(Rect2i(ox + 10, y + 10, 12, 13), p.hair)
		if style == "long":
			img.fill_rect(Rect2i(ox + 10, y + 10, 12, 20), p.hair)
	elif dir == 0:
		img.fill_rect(Rect2i(ox + 10, y + 10, 12, 5), p.hair)
		img.fill_rect(Rect2i(ox + 10, y + 10, 2, 9), p.hair)
		img.fill_rect(Rect2i(ox + 20, y + 10, 2, 9), p.hair)
		if style == "one_eye":
			img.fill_rect(Rect2i(ox + 10, y + 10, 6, 10), p.hair)  # curtain over left eye
		else:
			img.fill_rect(Rect2i(ox + 13, y + 18, 2, 2), p.eye)
		img.fill_rect(Rect2i(ox + 17, y + 18, 2, 2), p.eye)
	elif dir == 1:
		img.fill_rect(Rect2i(ox + 10, y + 10, 12, 5), p.hair)
		img.fill_rect(Rect2i(ox + 16, y + 10, 6, 12), p.hair)  # back of head
		if style == "one_eye":
			img.fill_rect(Rect2i(ox + 10, y + 10, 12, 10), p.hair)  # covered eye side
		else:
			img.fill_rect(Rect2i(ox + 12, y + 18, 2, 2), p.eye)
		img.fill_rect(Rect2i(ox + 9, y + 20, 1, 2), p.skin)    # nose
	else:
		img.fill_rect(Rect2i(ox + 10, y + 10, 12, 5), p.hair)
		img.fill_rect(Rect2i(ox + 10, y + 10, 6, 12), p.hair)
		img.fill_rect(Rect2i(ox + 18, y + 18, 2, 2), p.eye)
		img.fill_rect(Rect2i(ox + 22, y + 20, 1, 2), p.skin)   # nose
	if style == "afro":
		U.oellipse(img, ox + 16, y + 11, 8, 6, p.hair, OUT)

	# sunglasses pushed up on the hair
	if p.has("sunglasses"):
		img.fill_rect(Rect2i(ox + 11, y + 9, 4, 2), p.sunglasses)
		img.fill_rect(Rect2i(ox + 17, y + 9, 4, 2), p.sunglasses)

	# hat sits over hair, all directions
	if p.has("hat"):
		if p.get("hat_style", "straw") == "top":
			U.orect(img, Rect2i(ox + 9, y + 6, 14, 2), p.hat, OUT)   # brim over afro
			U.orect(img, Rect2i(ox + 11, y + 2, 10, 4), p.hat, OUT)  # crown (outline needs y>=1)
		else:
			U.orect(img, Rect2i(ox + 7, y + 10, 18, 2), p.hat, OUT)   # brim
			U.orect(img, Rect2i(ox + 11, y + 5, 10, 5), p.hat, OUT)   # crown
			img.fill_rect(Rect2i(ox + 11, y + 8, 10, 2), p.hat_band)

# Chopper: small reindeer, pink top hat with antlers. ~28px tall, feet on oy+58.
static func _draw_pet_frame(img: Image, ox: int, oy: int, p: Dictionary, dir: int, frame: int) -> void:
	var bob := 1 if (frame == 1 or frame == 3) else 0
	var y := oy - bob
	var OUT: Color = p.outline
	var lf := 2 if frame == 1 else 0
	var rf := 2 if frame == 3 else 0

	# legs (fur) anchored to oy
	U.orect(img, Rect2i(ox + 12, oy + 52, 3, 6 - lf), p.hair, OUT)
	U.orect(img, Rect2i(ox + 17, oy + 52, 3, 6 - rf), p.hair, OUT)
	# body: striped shorts
	U.orect(img, Rect2i(ox + 10, y + 44, 12, 9), p.pants, OUT)
	for i in 3:
		img.fill_rect(Rect2i(ox + 11 + i * 4, y + 45, 2, 7), Color8(240, 225, 210))
	# stubby arms
	U.orect(img, Rect2i(ox + 7, y + 45, 3, 5), p.hair, OUT)
	U.orect(img, Rect2i(ox + 22, y + 45, 3, 5), p.hair, OUT)
	# antlers
	U.orect(img, Rect2i(ox + 5, y + 27, 2, 7), p.shoe, OUT)
	U.orect(img, Rect2i(ox + 25, y + 27, 2, 7), p.shoe, OUT)
	# head (tan fur)
	U.orect(img, Rect2i(ox + 9, y + 32, 14, 13), p.skin, OUT)
	# hat: pink crown + brim, white X on crown
	U.orect(img, Rect2i(ox + 7, y + 31, 18, 2), p.hat, OUT)
	U.orect(img, Rect2i(ox + 11, y + 25, 10, 6), p.hat, OUT)
	img.fill_rect(Rect2i(ox + 15, y + 26, 2, 4), Color8(244, 244, 240))
	img.fill_rect(Rect2i(ox + 13, y + 27, 6, 2), Color8(244, 244, 240))
	# face
	if dir == 0:
		img.fill_rect(Rect2i(ox + 12, y + 36, 2, 2), p.eye)
		img.fill_rect(Rect2i(ox + 18, y + 36, 2, 2), p.eye)
		img.fill_rect(Rect2i(ox + 14, y + 40, 4, 3), p.nose)
	elif dir == 1:
		img.fill_rect(Rect2i(ox + 11, y + 36, 2, 2), p.eye)
		img.fill_rect(Rect2i(ox + 8, y + 40, 3, 3), p.nose)
	elif dir == 2:
		img.fill_rect(Rect2i(ox + 19, y + 36, 2, 2), p.eye)
		img.fill_rect(Rect2i(ox + 21, y + 40, 3, 3), p.nose)
	# dir 3 (up): fur back, no face
