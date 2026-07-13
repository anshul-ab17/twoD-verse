/**
 * TiledMapLayer.ts
 * Minimal Tiled JSON renderer for the SkyOffice map: tile layers go into a
 * static ground container; tile-objects (furniture, walls) go into the shared
 * y-sorted layer so avatars occlude correctly. No flip-bit support — the map
 * doesn't use flipped gids.
 */
import { Assets, Container, Rectangle, Sprite, Texture } from "pixi.js"

type TiledTileset = {
  firstgid: number
  name: string
  image: string
  columns: number
  tilewidth: number
  tileheight: number
}
type TiledObject = { x: number; y: number; gid?: number }
type TiledLayer = {
  type: string
  name: string
  data?: number[]
  objects?: TiledObject[]
}
type TiledMap = {
  width: number
  height: number
  tilewidth: number
  tileheight: number
  tilesets: TiledTileset[]
  layers: TiledLayer[]
}

const MAP_URL = "/skyoffice/map.json"

export class TiledMapLayer {
  ground = new Container()
  private objects: Sprite[] = []
  private gidTextures = new Map<number, Texture>()

  async init(sortLayer: Container) {
    const map = (await (await fetch(MAP_URL)).json()) as TiledMap

    const bases = new Map<TiledTileset, Texture>()
    await Promise.all(
      map.tilesets.map(async (ts) => {
        const file = ts.image.split("/").pop()!
        const tex = await Assets.load<Texture>(`/skyoffice/${file}`)
        tex.source.scaleMode = "nearest"
        bases.set(ts, tex)
      }),
    )

    const sorted = [...map.tilesets].sort((a, b) => a.firstgid - b.firstgid)
    const texFor = (gid: number): Texture | null => {
      if (!gid) return null
      const cached = this.gidTextures.get(gid)
      if (cached) return cached
      let ts = sorted[0]!
      for (const s of sorted) if (s.firstgid <= gid) ts = s
      const id = gid - ts.firstgid
      const frame = new Rectangle(
        (id % ts.columns) * ts.tilewidth,
        Math.floor(id / ts.columns) * ts.tileheight,
        ts.tilewidth,
        ts.tileheight,
      )
      const t = new Texture({ source: bases.get(ts)!.source, frame })
      this.gidTextures.set(gid, t)
      return t
    }

    for (const layer of map.layers) {
      if (layer.type === "tilelayer" && layer.data) {
        for (let i = 0; i < layer.data.length; i++) {
          const tex = texFor(layer.data[i]!)
          if (!tex) continue
          const s = new Sprite(tex)
          s.x = (i % map.width) * map.tilewidth
          s.y = Math.floor(i / map.width) * map.tileheight
          this.ground.addChild(s)
        }
      } else if (layer.type === "objectgroup" && layer.objects) {
        for (const o of layer.objects) {
          const tex = o.gid ? texFor(o.gid) : null
          if (!tex) continue
          const s = new Sprite(tex)
          s.anchor.set(0, 1) // Tiled tile-objects anchor bottom-left
          s.x = o.x
          s.y = o.y
          s.zIndex = o.y
          this.objects.push(s)
          sortLayer.addChild(s)
        }
      }
    }
  }

  destroy() {
    for (const s of this.objects) s.destroy()
    this.objects = []
    this.ground.destroy({ children: true })
  }
}
