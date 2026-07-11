extends Object
# Theme-independent UI sprites -> assets/ui/. Colors from Palettes.common().

const U = preload("res://gen/util.gd")

const ITEMS := {
	speech_bubble = Vector2i(48, 32),
	emote_heart = Vector2i(16, 16),
	emote_coffee = Vector2i(16, 16),
	emote_sleep = Vector2i(16, 16),
	emote_alert = Vector2i(16, 16),
	emote_music = Vector2i(16, 16),
	highlight = Vector2i(32, 32),
}

static func draw_speech_bubble(img: Image, c: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.rrect(img, Rect2i(2, 2, 44, 22), 3, c.white, c.outline)
	# tail, bottom-left
	for i in 5:
		img.fill_rect(Rect2i(10 + i, 24 + i, 5 - i, 1), c.white)
		img.fill_rect(Rect2i(9 + i, 24 + i, 1, 1), c.outline)
		img.fill_rect(Rect2i(15, 24 + i, 1, 1), c.outline)
	img.fill_rect(Rect2i(14, 29, 2, 1), c.outline)

static func draw_emote_heart(img: Image, c: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.oellipse(img, 5, 6, 3, 3, c.red, c.outline)
	U.oellipse(img, 11, 6, 3, 3, c.red, c.outline)
	for i in 5:
		img.fill_rect(Rect2i(3 + i, 8 + i, 11 - i * 2, 1), c.red)
	img.fill_rect(Rect2i(8, 13, 1, 1), c.red)
	img.fill_rect(Rect2i(4, 5, 2, 2), c.white * Color(1, 1, 1, 0.6))  # shine

static func draw_emote_coffee(img: Image, c: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(3, 6, 8, 7), c.white, c.outline)              # mug
	img.fill_rect(Rect2i(4, 7, 6, 2), c.coffee)
	U.oellipse(img, 12, 9, 2, 2, Color(0, 0, 0, 0), c.outline)        # handle
	img.fill_rect(Rect2i(5, 2, 1, 3), c.stone)                        # steam
	img.fill_rect(Rect2i(8, 1, 1, 3), c.stone)

static func draw_emote_sleep(img: Image, c: Dictionary, _rng: RandomNumberGenerator) -> void:
	for z in [[1, 8, 6], [7, 4, 5], [11, 1, 4]]:  # x, y, size
		var x: int = z[0]; var y: int = z[1]; var s: int = z[2]
		img.fill_rect(Rect2i(x, y, s, 1), c.blue)
		img.fill_rect(Rect2i(x, y + s - 1, s, 1), c.blue)
		for i in range(s - 2, 0, -1):
			img.fill_rect(Rect2i(x + i, y + s - 1 - i, 1, 1), c.blue)

static func draw_emote_alert(img: Image, c: Dictionary, _rng: RandomNumberGenerator) -> void:
	U.orect(img, Rect2i(6, 1, 4, 9), c.red, c.outline)
	U.orect(img, Rect2i(6, 12, 4, 3), c.red, c.outline)

static func draw_emote_music(img: Image, c: Dictionary, _rng: RandomNumberGenerator) -> void:
	img.fill_rect(Rect2i(4, 2, 9, 2), c.white)                        # beam
	img.fill_rect(Rect2i(4, 2, 2, 9), c.white)                        # stems
	img.fill_rect(Rect2i(11, 3, 2, 9), c.white)
	U.ellipse(img, 4, 11, 2, 2, c.white)                              # note heads
	U.ellipse(img, 11, 12, 2, 2, c.white)

static func draw_highlight(img: Image, c: Dictionary, _rng: RandomNumberGenerator) -> void:
	# corner brackets: full 2px border, then erase the middle of each side
	var col: Color = c.glow
	img.fill_rect(Rect2i(1, 1, 30, 30), col)
	img.fill_rect(Rect2i(3, 3, 26, 26), Color(0, 0, 0, 0))
	var clear := Color(0, 0, 0, 0)
	img.fill_rect(Rect2i(10, 1, 12, 2), clear)
	img.fill_rect(Rect2i(10, 29, 12, 2), clear)
	img.fill_rect(Rect2i(1, 10, 2, 12), clear)
	img.fill_rect(Rect2i(29, 10, 2, 12), clear)
