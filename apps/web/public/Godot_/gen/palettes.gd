extends Object
# All colors for themes and characters. Built in funcs (Color8 not allowed in const).

static func common() -> Dictionary:
	return {
		outline = Color8(34, 32, 52),
		white = Color8(244, 244, 240),
		screen = Color8(120, 190, 230),
		screen_dark = Color8(70, 130, 180),
		water = Color8(96, 160, 200),
		water_dark = Color8(66, 120, 160),
		leaf = Color8(96, 150, 70),
		leaf_dark = Color8(64, 110, 48),
		leaf_light = Color8(140, 190, 100),
		terracotta = Color8(180, 100, 70),
		terracotta_dark = Color8(140, 72, 50),
		koi = Color8(235, 120, 50),
		coffee = Color8(90, 58, 38),
		trunk = Color8(110, 80, 50),
		glow = Color8(255, 230, 150),
		red = Color8(200, 70, 60),
		blue = Color8(70, 110, 200),
		stone = Color8(150, 148, 140),
		stone_dark = Color8(112, 110, 104),
	}

static func themes() -> Dictionary:
	var c := common()
	var t := {
		office = {
			wood = Color8(161, 120, 80), wood_dark = Color8(120, 86, 54),
			accent = Color8(72, 120, 200), accent_dark = Color8(50, 90, 160),
			fabric = Color8(130, 140, 150), fabric_dark = Color8(100, 110, 120),
			metal = Color8(190, 195, 200), metal_dark = Color8(120, 126, 134),
			rounded = false,
		},
		cafe = {
			wood = Color8(178, 126, 78), wood_dark = Color8(134, 92, 56),
			accent = Color8(224, 122, 95), accent_dark = Color8(180, 90, 70),
			fabric = Color8(236, 220, 190), fabric_dark = Color8(205, 185, 150),
			metal = Color8(150, 140, 130), metal_dark = Color8(105, 98, 90),
			rounded = true,
		},
		zen = {
			wood = Color8(94, 72, 55), wood_dark = Color8(66, 50, 38),
			accent = Color8(122, 158, 96), accent_dark = Color8(90, 124, 70),
			fabric = Color8(216, 206, 180), fabric_dark = Color8(182, 170, 142),
			metal = Color8(140, 140, 132), metal_dark = Color8(96, 96, 90),
			rounded = false,
		},
		library = {
			wood = Color8(122, 68, 50), wood_dark = Color8(88, 46, 34),
			accent = Color8(58, 110, 74), accent_dark = Color8(40, 82, 54),
			fabric = Color8(140, 60, 64), fabric_dark = Color8(104, 42, 48),
			metal = Color8(168, 140, 92), metal_dark = Color8(126, 102, 62),
			rounded = false,
		},
		lounge = {
			wood = Color8(196, 158, 110), wood_dark = Color8(150, 116, 76),
			accent = Color8(70, 160, 150), accent_dark = Color8(48, 120, 112),
			fabric = Color8(226, 178, 84), fabric_dark = Color8(184, 140, 60),
			metal = Color8(200, 200, 205), metal_dark = Color8(140, 140, 148),
			rounded = true,
		},
	}
	for name in t:
		t[name].merge(c)
	return t

static func characters() -> Array:
	var outline := Color8(34, 32, 52)
	var eye := Color8(40, 36, 48)
	return [
		{
			# straw hat, open red vest, yellow sash, blue shorts, sandals
			name = "luffy", skin = Color8(235, 190, 150), hair = Color8(30, 28, 32),
			shirt = Color8(200, 50, 45), pants = Color8(74, 120, 190),
			shoe = Color8(160, 120, 80), eye = eye, outline = outline,
			hat = Color8(235, 205, 110), hat_band = Color8(200, 70, 60),
			vest = true, sash = Color8(240, 200, 80), shorts = true,
		},
		{
			# green hair, white shirt, green haramaki, dark pants, swords
			name = "zoro", skin = Color8(225, 180, 140), hair = Color8(100, 170, 105),
			shirt = Color8(235, 232, 222), pants = Color8(48, 60, 50),
			shoe = Color8(30, 30, 36), eye = eye, outline = outline,
			haramaki = Color8(110, 150, 85), swords = true,
		},
		{
			# long orange hair, green crop top, blue jeans, sandals
			name = "nami", skin = Color8(245, 205, 175), hair = Color8(230, 130, 50),
			shirt = Color8(125, 185, 85), pants = Color8(70, 110, 180),
			shoe = Color8(210, 160, 110), eye = eye, outline = outline,
			hair_style = "long", midriff = true,
		},
		{
			# blond hair over one eye, black suit, dark tie
			name = "sanji", skin = Color8(240, 200, 170), hair = Color8(230, 200, 110),
			shirt = Color8(42, 40, 48), pants = Color8(36, 36, 44),
			shoe = Color8(24, 24, 30), eye = eye, outline = outline,
			hair_style = "one_eye", tie = Color8(60, 70, 110),
		},
		{
			# long black hair, sunglasses on head, blue crop top, pink sarong, heels
			name = "robin", skin = Color8(220, 180, 150), hair = Color8(28, 28, 36),
			shirt = Color8(58, 82, 165), pants = Color8(44, 42, 50),
			shoe = Color8(200, 60, 70), eye = eye, outline = outline,
			hair_style = "long", midriff = true,
			skirt = Color8(228, 108, 118), sunglasses = Color8(235, 120, 40),
		},
		{
			# skeleton: bone-white skin, black afro + top hat, dark suit, orange cravat
			name = "brook", skin = Color8(240, 238, 228), hair = Color8(26, 25, 30),
			shirt = Color8(48, 44, 54), pants = Color8(48, 44, 54),
			shoe = Color8(24, 24, 30), eye = eye, outline = outline,
			hair_style = "afro", hat = Color8(22, 22, 26), hat_style = "top",
			tie = Color8(230, 140, 50),
		},
		{
			# office pet: tan fur, pink X hat, blue nose, striped shorts
			name = "chopper", skin = Color8(214, 160, 110), hair = Color8(150, 104, 66),
			shirt = Color8(214, 160, 110), pants = Color8(220, 100, 130),
			shoe = Color8(120, 84, 54), eye = eye, outline = outline,
			hat = Color8(230, 120, 150), nose = Color8(70, 110, 200),
			pet = true,
		},
	]
