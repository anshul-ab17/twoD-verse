/**
 * UILayer.ts
 * Renders in-world room labels and XP zone badges using PixiJS Graphics + Text.
 */
import { Container, Graphics, Text } from "pixi.js"
import { ROOMS, TILE_SIZE } from "./map-data"

export class UILayer {
  container: Container
  private t = 0

  constructor() {
    this.container = new Container()
  }

  init() {
    this._buildRoomLabels()
  }

  private _buildRoomLabels() {
    for (const room of ROOMS) {
      if (!room.label || !room.xpTag) continue

      const c = new Container()

      // Pill
      const pill = new Graphics()
      pill.roundRect(-52, -10, 104, 20, 10)
      pill.fill({ color: room.color, alpha: 0.75 })

      // Text
      const textStr = room.xpTag ? `${room.label} · ${room.xpTag}` : room.label
      const t = new Text({
        text: textStr,
        style: {
          fontFamily: "'system-ui', sans-serif",
          fontSize: 9,
          fill: "#ffffff",
          fontWeight: "bold",
        }
      })
      t.anchor.set(0.5, 0.5)

      c.addChild(pill)
      c.addChild(t)

      // Center of the room
      c.x = (room.col + room.cols / 2) * TILE_SIZE
      c.y = (room.row + 1.4) * TILE_SIZE

      this.container.addChild(c)
    }
  }

  tick(dt: number) {
    this.t += dt * 0.015
    // Gentle float for all labels
    for (const child of this.container.children) {
      child.y += Math.sin(this.t + child.x * 0.001) * 0.04
    }
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
