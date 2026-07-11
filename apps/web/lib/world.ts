import * as THREE from "three"
import { Client, getStateCallbacks } from "colyseus.js"
import {
  MSG, WORLD, SPIKE_ZONES, CHAT_BROADCAST, LEVEL_UP, SnapshotBuffer,
  dayPhase, darknessAt, proximityGain,
  type ChatBroadcast, type LevelUpBroadcast, type WorldRoomState, type PlayerState,
} from "@repo/game-core"
import { bridge } from "./bridge"
import { applyProximityGains } from "./media"
import { loadCharacterSprite, CHAR_HEIGHT, type CharacterSprite } from "./godot-sprites"

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://localhost:2567"

// ISO_DIST: camera sits at (d,d,d) relative to target — pure (1,1,1) isometric angle.
const ISO_DIST = 1200

// World pixel coords → Three.js XZ coords (Y = up, world center = Three origin)
const wx2x = (wx: number) => wx - WORLD.width / 2
const wy2z = (wy: number) => wy - WORLD.height / 2

export type WorldHandle = {
  destroy: () => void
  sendChat: (text: string) => void
}

async function buildScene(scene: THREE.Scene): Promise<void> {
  const loader = new THREE.TextureLoader()

  // helper: load texture with pixel-art settings
  const loadTex = async (url: string) => {
    const t = await loader.loadAsync(url)
    t.magFilter = THREE.NearestFilter
    t.minFilter = THREE.NearestFilter
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }

  // --- Floor ---
  const floorTex = await loadTex("/_godot/assets/tiles/office/floor_wood.png")
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping
  floorTex.repeat.set(WORLD.width / 32, WORLD.height / 32)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.width, WORLD.height),
    new THREE.MeshBasicMaterial({ map: floorTex }),
  )
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  // --- Zone carpet overlays ---
  for (const zone of SPIKE_ZONES) {
    const theme = zone.kind === "voice" ? "lounge" : "office"
    const carpetTex = await loadTex(`/_godot/assets/tiles/${theme}/floor_soft.png`)
    carpetTex.wrapS = carpetTex.wrapT = THREE.RepeatWrapping
    carpetTex.repeat.set(zone.bounds.w / 32, zone.bounds.h / 32)
    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(zone.bounds.w, zone.bounds.h),
      new THREE.MeshBasicMaterial({ map: carpetTex, transparent: true, opacity: 0.9 }),
    )
    carpet.rotation.x = -Math.PI / 2
    carpet.position.set(
      wx2x(zone.bounds.x + zone.bounds.w / 2),
      0.5, // above floor to prevent z-fighting
      wy2z(zone.bounds.y + zone.bounds.h / 2),
    )
    scene.add(carpet)
  }

  // --- Walls ---
  const WALL_H = 80, WALL_T = 12
  const wallTex = await loadTex("/_godot/assets/tiles/office/wall.png")
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping

  const makeWall = (width: number, depth: number, wx: number, wy: number) => {
    const t = wallTex.clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(Math.max(width, depth) / 32, WALL_H / 32)
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, WALL_H, depth),
      new THREE.MeshBasicMaterial({ map: t }),
    )
    mesh.position.set(wx2x(wx), WALL_H / 2, wy2z(wy))
    scene.add(mesh)
  }

  makeWall(WORLD.width, WALL_T, WORLD.width / 2, WALL_T / 2)               // top
  makeWall(WORLD.width, WALL_T, WORLD.width / 2, WORLD.height - WALL_T / 2) // bottom
  makeWall(WALL_T, WORLD.height, WALL_T / 2, WORLD.height / 2)              // left
  makeWall(WALL_T, WORLD.height, WORLD.width - WALL_T / 2, WORLD.height / 2) // right

  // --- Furniture ---
  const placeFurniture = async (item: string, theme: string, wx: number, wy: number) => {
    const tex = await loadTex(`/_godot/assets/furniture/${theme}/${item}.png`)
    const w = (tex.image as HTMLImageElement).width
    const h = (tex.image as HTMLImageElement).height
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide }),
    )
    mesh.position.set(wx2x(wx), h / 2, wy2z(wy))
    scene.add(mesh)
  }

  // Desk pods in open area (mirrors current drawOffice layout)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const bx = 744 + col * 160
      const by = 172 + row * 160
      await placeFurniture("desk", "office", bx, by)
      await placeFurniture("chair", "office", bx, by + 52)
      await placeFurniture("pc", "office", bx, by - 20)
    }
  }

  // Meeting room
  const m = SPIKE_ZONES.find((z) => z.kind === "meeting")!.bounds
  await placeFurniture("meeting_table", "office", m.x + m.w / 2, m.y + m.h / 2)
  await Promise.all(
    Array.from({ length: 4 }, (_, i) =>
      Promise.all([
        placeFurniture("chair", "office", m.x + m.w / 2 - 60 + i * 40, m.y + m.h / 2 - 62),
        placeFurniture("chair", "office", m.x + m.w / 2 - 60 + i * 40, m.y + m.h / 2 + 62),
      ]),
    ),
  )

  // Voice lounge
  const v = SPIKE_ZONES.find((z) => z.kind === "voice")!.bounds
  await placeFurniture("sofa", "lounge", v.x + 90, v.y + 57)
  await placeFurniture("sofa", "lounge", v.x + 90, v.y + v.h - 57)
  await placeFurniture("rug", "lounge", v.x + v.w / 2, v.y + v.h / 2)

  // Corner plants
  for (const [px, py] of [
    [50, 50], [WORLD.width - 50, 50],
    [50, WORLD.height - 50], [WORLD.width - 50, WORLD.height - 50],
  ] as [number, number][]) {
    await placeFurniture("plant", "office", px, py)
  }
}

export async function createWorld(
  el: HTMLElement,
  token: string,
  character: string,
): Promise<WorldHandle> {
  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.domElement.style.display = "block"
  el.appendChild(renderer.domElement)

  // --- Scene ---
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x14161f)

  // --- Orthographic camera at isometric angle ---
  const hw = window.innerWidth / 2
  const hh = window.innerHeight / 2
  const camera = new THREE.OrthographicCamera(-hw, hw, hh, -hh, 0.1, 20000)
  camera.position.set(ISO_DIST, ISO_DIST, ISO_DIST)
  camera.lookAt(0, 0, 0)

  // --- Resize handler ---
  const onResize = () => {
    const w = window.innerWidth, h = window.innerHeight
    camera.left = -w / 2; camera.right = w / 2
    camera.top = h / 2;   camera.bottom = -h / 2
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener("resize", onResize)

  // --- Day/night overlay ---
  const nightMat = new THREE.MeshBasicMaterial({
    color: 0x0a1030, transparent: true, depthWrite: false, depthTest: false,
  })
  const nightPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.width * 3, WORLD.height * 3),
    nightMat,
  )
  nightPlane.rotation.x = -Math.PI / 2
  nightPlane.position.y = 200
  nightPlane.renderOrder = 999
  scene.add(nightPlane)

  // --- Build static scene (floor, walls, furniture) ---
  await buildScene(scene)

  // --- Avatar tracking ---
  type AvatarEntry = {
    cs: CharacterSprite
    buf: SnapshotBuffer
    state: PlayerState
  }
  const remotes = new Map<string, AvatarEntry>()
  let own: { cs: CharacterSprite; state: PlayerState } | null = null

  // --- Colyseus ---
  let room
  try {
    room = await new Client(REALTIME_URL).joinOrCreate<WorldRoomState>("world", { token, character })
  } catch (err) {
    bridge.emit("net:disconnected", undefined)
    renderer.dispose()
    el.removeChild(renderer.domElement)
    throw err
  }
  bridge.emit("net:connected", { sessionId: room.sessionId })
  room.onLeave(() => bridge.emit("net:disconnected", undefined))
  room.onMessage(CHAT_BROADCAST, (msg: ChatBroadcast) => bridge.emit("chat:message", msg))
  room.onMessage(LEVEL_UP, (msg: LevelUpBroadcast) => {
    if (msg.sessionId === room.sessionId) bridge.emit("player:level-up", { level: msg.level })
  })

  const $ = getStateCallbacks(room)

  $(room.state).players.onAdd(async (p, id) => {
    const name = p.character || "luffy"
    const cs = await loadCharacterSprite(name)
    cs.setPosition(p.x, p.y)
    scene.add(cs.sprite)

    if (id === room.sessionId) {
      own = { cs, state: p }
      $(p).listen("zoneId", (zoneId) => bridge.emit("player:zone-changed", { zoneId }))
      $(p).listen("xp", (xp) => bridge.emit("player:xp-changed", { xp, level: p.level }))
      $(p).listen("level", (level) => bridge.emit("player:xp-changed", { xp: p.xp, level }))
      $(p).listen("questStep", (questStep) => bridge.emit("player:quest-changed", { questStep }))
      $(p).listen("streak", (streak) => bridge.emit("player:streak-changed", { streak }))
    } else {
      const buf = new SnapshotBuffer()
      buf.push({ t: performance.now(), x: p.x, y: p.y })
      remotes.set(id, { cs, buf, state: p })
      $(p).onChange(() => buf.push({ t: performance.now(), x: p.x, y: p.y }))
    }
  })

  $(room.state).players.onRemove((_p, id) => {
    const r = remotes.get(id)
    if (r) { r.cs.dispose(); remotes.delete(id) }
  })

  // --- Render loop ---
  const clock = new THREE.Clock()
  let animId = 0
  let lastProx = 0

  const render = () => {
    animId = requestAnimationFrame(render)
    const elapsed = clock.getElapsedTime()
    const now = performance.now()

    // day/night
    nightMat.opacity = darknessAt(dayPhase())

    // own player
    if (own) {
      own.cs.update("walk", own.state.dir, elapsed)
      own.cs.setPosition(own.state.x, own.state.y)
      // camera follows: offset by ISO_DIST in all 3 axes from player position
      const tx = wx2x(own.state.x)
      const tz = wy2z(own.state.y)
      camera.position.set(tx + ISO_DIST, ISO_DIST, tz + ISO_DIST)
      camera.lookAt(tx, 0, tz)
    }

    // remote players
    for (const { cs, buf, state } of remotes.values()) {
      const pos = buf.sample(now)
      if (pos) {
        cs.update("walk", state.dir, elapsed)
        cs.setPosition(pos.x, pos.y)
      }
    }

    // proximity voice: update gains every 250ms
    if (own && now - lastProx > 250) {
      lastProx = now
      const gains = new Map<string, number>()
      for (const { state } of remotes.values()) {
        const d = Math.hypot(state.x - own.state.x, state.y - own.state.y)
        gains.set(state.id, proximityGain(d))
      }
      applyProximityGains(gains)
    }

    renderer.render(scene, camera)
  }
  render()

  // --- Input (identical to old world.ts) ---
  const DIR_KEYS = new Set(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyW","KeyA","KeyS","KeyD"])
  const pressed = new Set<string>()
  let last = { dx: 0, dy: 0 }
  const has = (...codes: string[]) => codes.some((c) => pressed.has(c))
  const isTyping = () => {
    const active = document.activeElement
    return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
  }
  const onKey = (e: KeyboardEvent) => {
    if (!DIR_KEYS.has(e.code)) return
    if (isTyping()) {
      pressed.clear()
      if (last.dx !== 0 || last.dy !== 0) { last = { dx: 0, dy: 0 }; room.send(MSG.MOVE, last) }
      return
    }
    if (e.type === "keydown") pressed.add(e.code)
    else pressed.delete(e.code)
    const dx = (has("ArrowRight","KeyD") ? 1 : 0) - (has("ArrowLeft","KeyA") ? 1 : 0)
    const dy = (has("ArrowDown","KeyS") ? 1 : 0) - (has("ArrowUp","KeyW") ? 1 : 0)
    if (dx !== last.dx || dy !== last.dy) { last = { dx, dy }; room.send(MSG.MOVE, last) }
  }
  window.addEventListener("keydown", onKey)
  window.addEventListener("keyup", onKey)

  return {
    sendChat: (text: string) => {
      const t = text.trim()
      if (t) room.send(MSG.CHAT, { text: t })
    },
    destroy: () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("keyup", onKey)
      window.removeEventListener("resize", onResize)
      for (const { cs } of remotes.values()) cs.dispose()
      own?.cs.dispose()
      void room.leave()
      renderer.dispose()
      if (renderer.domElement.parentNode) el.removeChild(renderer.domElement)
    },
  }
}
