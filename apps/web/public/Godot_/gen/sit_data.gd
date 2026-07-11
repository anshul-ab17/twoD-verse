extends Object
# Sitting sprite sizes and seat anchor data (pixels, scale 1.0).
# sit_pos() returns the top-left of the sit sprite relative to furniture top-left.
# Use: sit_sprite.position = furniture.position + SitData.sit_pos(char, seat)

# Sit sprite dimensions (w x h) from assets/characters/<name>_sit.png
const CHARS := {
    luffy   = Vector2i(58, 81),
    zoro    = Vector2i(64, 84),
    nami    = Vector2i(61, 83),
    sanji   = Vector2i(45, 82),
    robin   = Vector2i(45, 83),
    brook   = Vector2i(57, 95),
    usopp   = Vector2i(61, 79),
    chopper = Vector2i(80, 59),
}

# seat_y_pct: y of seat line from furniture top (fraction of furniture height)
# seat_x_pct: horizontal centre of seat (fraction of furniture width)
const SEATS := {
    chair         = {size = Vector2i(32, 40),  seat_y_pct = 0.55, seat_x_pct = 0.5},
    sofa          = {size = Vector2i(64, 40),  seat_y_pct = 0.60, seat_x_pct = 0.5},
    meeting_table = {size = Vector2i(96, 64),  seat_y_pct = 0.45, seat_x_pct = 0.5},
    pet_bed       = {size = Vector2i(48, 32),  seat_y_pct = 0.75, seat_x_pct = 0.5},
}

# Top-left of sit sprite relative to furniture top-left (scale 1.0, centered on seat).
static func sit_pos(char_name: String, seat_name: String) -> Vector2i:
    var sw: Vector2i = CHARS[char_name]
    var seat: Dictionary = SEATS[seat_name]
    var seat_x := int(seat.size.x * seat.seat_x_pct)
    var seat_y := int(seat.size.y * seat.seat_y_pct)
    return Vector2i(seat_x - sw.x / 2, seat_y - sw.y)

# Precomputed table: all chars x all seats (scale 1.0 pixel offsets from furniture TL)
# character  | chair (32x40)       | sofa (64x40)        | meeting_table (96x64) | pet_bed (48x32)
# luffy      | (-13, -59)          | ( 3, -57)           | (19, -52)             | (-17, -52)
# zoro       | (-16, -62)          | ( 0, -60)           | (16, -55)             | (-20, -55)
# nami       | (-15, -61)          | ( 1, -59)           | (17, -54)             | (-19, -54)
# sanji      | (  7, -60)          | (23, -58)           | (39, -53)             | (  5, -53)
# robin      | (  7, -61)          | (23, -59)           | (39, -54)             | (  5, -54)
# brook      | (-13, -73)          | ( 3, -71)           | (19, -66)             | (-17, -66)
# usopp      | (-15, -57)          | ( 1, -55)           | (17, -50)             | (-19, -50)
# chopper    | (-24, -37)          | ( -8, -35)          |  ( 8, -30)            | (-16, -30) [pet_bed]
