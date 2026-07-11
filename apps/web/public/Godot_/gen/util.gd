extends Object
# Pixel drawing helpers. fill_rect clips to image bounds, so no manual clamping.

static func orect(img: Image, r: Rect2i, fill: Color, outline: Color) -> void:
	img.fill_rect(Rect2i(r.position - Vector2i(1, 1), r.size + Vector2i(2, 2)), outline)
	img.fill_rect(r, fill)

static func ellipse(img: Image, cx: int, cy: int, rx: int, ry: int, col: Color) -> void:
	if rx <= 0 or ry <= 0:
		return
	for y in range(-ry, ry + 1):
		var t := 1.0 - float(y * y) / float(ry * ry)
		if t < 0.0:
			continue
		var w := int(round(float(rx) * sqrt(t)))
		img.fill_rect(Rect2i(cx - w, cy + y, w * 2 + 1, 1), col)

static func oellipse(img: Image, cx: int, cy: int, rx: int, ry: int, fill: Color, outline: Color) -> void:
	ellipse(img, cx, cy, rx + 1, ry + 1, outline)
	ellipse(img, cx, cy, rx, ry, fill)

# Rect with corners cut by `cut` px (cheap rounded corners for pixel art).
static func rrect(img: Image, r: Rect2i, cut: int, fill: Color, outline: Color) -> void:
	orect(img, Rect2i(r.position.x + cut, r.position.y, r.size.x - cut * 2, r.size.y), fill, outline)
	orect(img, Rect2i(r.position.x, r.position.y + cut, r.size.x, r.size.y - cut * 2), fill, outline)
	# re-fill interior so inner outline lines vanish
	img.fill_rect(Rect2i(r.position.x + cut, r.position.y + 1, r.size.x - cut * 2, r.size.y - 2), fill)
	img.fill_rect(Rect2i(r.position.x + 1, r.position.y + cut, r.size.x - 2, r.size.y - cut * 2), fill)
