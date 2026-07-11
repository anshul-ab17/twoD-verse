extends SceneTree
# Generates all assets. Run:
# Godot_v4.7-stable_win64_console.exe --headless --path . --script res://gen/main.gd

const Palettes = preload("res://gen/palettes.gd")
const Characters = preload("res://gen/characters.gd")
const Furniture = preload("res://gen/furniture.gd")
const Tiles = preload("res://gen/tiles.gd")
const UI = preload("res://gen/ui.gd")
const Map = preload("res://gen/map.gd")

func _init() -> void:
	var base := ProjectSettings.globalize_path("res://assets")

	# characters: sheets in assets/characters/ are sliced from the One Piece
	# reference art (see docs), NOT generated here. Don't overwrite them.

	# furniture, per theme
	var themes: Dictionary = Palettes.themes()
	var all_furniture := {}   # {theme: {item: Image}}
	for theme_name in themes:
		var t: Dictionary = themes[theme_name]
		DirAccess.make_dir_recursive_absolute(base + "/furniture/" + theme_name)
		var images := {}
		for item in Furniture.ITEMS:
			var size: Vector2i = Furniture.ITEMS[item]
			var img := Image.create_empty(size.x, size.y, false, Image.FORMAT_RGBA8)
			var rng := RandomNumberGenerator.new()
			rng.seed = hash(str(theme_name) + str(item))
			Callable(Furniture, "draw_" + item).call(img, t, rng)
			_save(img, "res://assets/furniture/%s/%s.png" % [theme_name, item])
			images[item] = img
		all_furniture[theme_name] = images
		_theme_preview(theme_name, images)

	# tiles, per theme
	var tile_rows := {}
	var all_tiles := {}   # {theme: {tile_name: Image}}
	for theme_name in themes:
		var t: Dictionary = themes[theme_name]
		DirAccess.make_dir_recursive_absolute(base + "/tiles/" + theme_name)
		var row: Array[Image] = []
		var tile_dict := {}
		for tile in Tiles.TILES:
			var img := Image.create_empty(32, 32, false, Image.FORMAT_RGBA8)
			var rng := RandomNumberGenerator.new()
			rng.seed = hash(str(theme_name) + tile)
			Callable(Tiles, "draw_" + tile).call(img, t, rng)
			_save(img, "res://assets/tiles/%s/%s.png" % [theme_name, tile])
			row.append(img)
			tile_dict[tile] = img
		tile_rows[theme_name] = row
		all_tiles[theme_name] = tile_dict
	_tiles_preview(tile_rows)

	# room map previews, per theme
	DirAccess.make_dir_recursive_absolute(base + "/maps")
	for theme_name in themes:
		var map_img := Map.render(all_tiles[theme_name], all_furniture[theme_name])
		map_img.resize(map_img.get_width() * 2, map_img.get_height() * 2, Image.INTERPOLATE_NEAREST)
		_save(map_img, "res://assets/preview_map_%s.png" % theme_name)

	# ui (theme-independent)
	DirAccess.make_dir_recursive_absolute(base + "/ui")
	var c := Palettes.common()
	for item in UI.ITEMS:
		var size: Vector2i = UI.ITEMS[item]
		var img := Image.create_empty(size.x, size.y, false, Image.FORMAT_RGBA8)
		var rng := RandomNumberGenerator.new()
		rng.seed = hash(str(item))
		Callable(UI, "draw_" + item).call(img, c, rng)
		_save(img, "res://assets/ui/%s.png" % item)

	print("Done. Output in assets/")
	quit()

# One row per theme: each tile drawn 2x2 to check seams, 2x scale.
func _tiles_preview(rows: Dictionary) -> void:
	var cell := 72
	var sheet := Image.create_empty(cell * 4, cell * rows.size(), false, Image.FORMAT_RGBA8)
	sheet.fill(Color8(58, 58, 66))
	var ry := 0
	for theme_name in rows:
		var row: Array = rows[theme_name]
		for i in row.size():
			var img: Image = row[i]
			for dy in 2:
				for dx in 2:
					sheet.blend_rect(img, Rect2i(0, 0, 32, 32), Vector2i(i * cell + 2 + dx * 32, ry * cell + 2 + dy * 32))
		ry += 1
	sheet.resize(sheet.get_width() * 2, sheet.get_height() * 2, Image.INTERPOLATE_NEAREST)
	_save(sheet, "res://assets/preview_tiles.png")

func _save(img: Image, path: String) -> void:
	var err := img.save_png(path)
	if err != OK:
		push_error("save failed: %s (%d)" % [path, err])

# Contact sheet: items in a grid, 6 per row, 2x nearest-neighbor scale.
func _theme_preview(theme_name: String, images: Dictionary) -> void:
	var cell := Vector2i(100, 70)
	var cols := 6
	var rows := int(ceil(float(images.size()) / cols))
	var sheet := Image.create_empty(cell.x * cols, cell.y * rows, false, Image.FORMAT_RGBA8)
	sheet.fill(Color8(58, 58, 66))
	var i := 0
	for item in images:
		var img: Image = images[item]
		var cx := (i % cols) * cell.x + (cell.x - img.get_width()) / 2
		var cy := (i / cols) * cell.y + (cell.y - img.get_height()) / 2
		sheet.blend_rect(img, Rect2i(Vector2i.ZERO, img.get_size()), Vector2i(cx, cy))
		i += 1
	sheet.resize(sheet.get_width() * 2, sheet.get_height() * 2, Image.INTERPOLATE_NEAREST)
	_save(sheet, "res://assets/preview_%s.png" % theme_name)

