import type { RealtimePlayer } from "../types"
import type { RemotePlayerManager } from "./remotePlayers"
import type MainScene from "./MainScene"

export function emitPlayerState(scene: MainScene, force = false) {
  if (!scene.player || typeof window === "undefined") return

  const now = scene.time.now
  const x = Math.round(scene.player.x)
  const y = Math.round(scene.player.y)
  const roomId = Number.isFinite(scene.currentRoomId) ? scene.currentRoomId : -1

  const movedEnough =
    !Number.isFinite(scene.lastStateEmitX) ||
    Math.abs(x - scene.lastStateEmitX) >= 2 ||
    Math.abs(y - scene.lastStateEmitY) >= 2
  const roomChanged = roomId !== scene.lastStateEmitRoom
  const throttled = now - scene.lastStateEmitAt < 80

  if (!force && !roomChanged && (!movedEnough || throttled)) return

  scene.lastStateEmitX = x
  scene.lastStateEmitY = y
  scene.lastStateEmitRoom = roomId
  scene.lastStateEmitAt = now

  window.dispatchEvent(new CustomEvent("twodverse:player-state", { detail: { x, y, roomId } }))
}

export function bindRemotePlayerEvents(scene: MainScene, manager: RemotePlayerManager) {
  if (typeof window === "undefined") return

  scene.onRemotePlayersSync = (event: Event) => {
    const e = event as CustomEvent<{ players?: RealtimePlayer[] }>
    const players = Array.isArray(e.detail?.players) ? e.detail.players : []
    manager.sync(players)
  }

  scene.onRemotePlayerUpsert = (event: Event) => {
    const e = event as CustomEvent<{ player?: RealtimePlayer }>
    if (e.detail?.player?.userId) manager.upsert(e.detail.player)
  }

  scene.onRemotePlayerLeft = (event: Event) => {
    const e = event as CustomEvent<{ userId?: string }>
    if (e.detail?.userId) manager.remove(e.detail.userId)
  }

  scene.onThemeChange = (event: Event) => {
    const e = event as CustomEvent<{ theme?: string }>
    if (e.detail?.theme) scene.applyTheme(e.detail.theme)
  }

  window.addEventListener("twodverse:remote-players:sync", scene.onRemotePlayersSync)
  window.addEventListener("twodverse:remote-player:upsert", scene.onRemotePlayerUpsert)
  window.addEventListener("twodverse:remote-player:left", scene.onRemotePlayerLeft)
  window.addEventListener("twodverse:set-theme", scene.onThemeChange)
  window.dispatchEvent(new Event("twodverse:scene-ready"))
}

export function unbindRemotePlayerEvents(scene: MainScene) {
  if (typeof window === "undefined") return

  if (scene.onRemotePlayersSync) {
    window.removeEventListener("twodverse:remote-players:sync", scene.onRemotePlayersSync)
    scene.onRemotePlayersSync = undefined
  }
  if (scene.onRemotePlayerUpsert) {
    window.removeEventListener("twodverse:remote-player:upsert", scene.onRemotePlayerUpsert)
    scene.onRemotePlayerUpsert = undefined
  }
  if (scene.onRemotePlayerLeft) {
    window.removeEventListener("twodverse:remote-player:left", scene.onRemotePlayerLeft)
    scene.onRemotePlayerLeft = undefined
  }
  if (scene.onThemeChange) {
    window.removeEventListener("twodverse:set-theme", scene.onThemeChange)
    scene.onThemeChange = undefined
  }
}
