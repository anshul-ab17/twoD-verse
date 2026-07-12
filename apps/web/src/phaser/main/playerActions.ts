import { CHAR_CONFIGS } from "../constants"
import { idleAnimKey } from "../charUtils"
import { findNearestWalkablePosition, findSpawnPoint } from "./roomLogic"
import { findNearestInteractable, getInteractableLabel, getInteractableVerb } from "./interactables"
import type { Interactable } from "../types"
import type MainScene from "./MainScene"

function setCollisionEnabled(scene: MainScene, enabled: boolean) {
  if (!scene.player) return
  const body = scene.player.body as Phaser.Physics.Arcade.Body | undefined
  if (body) body.checkCollision.none = !enabled
}

function nearestWalkable(scene: MainScene, x: number, y: number, r = 4) {
  return findNearestWalkablePosition(
    scene.roomByTile, scene.mapWidthInTiles, scene.mapHeightInTiles,
    scene.tileWidth, scene.tileHeight, x, y, r,
  )
}

export function showInteractionStatus(scene: MainScene, message: string) {
  if (!scene.interactionStatus) return
  scene.interactionStatus.setText(message)
  scene.interactionStatus.setVisible(true)
  scene.interactionStatusTimer?.remove(false)
  scene.interactionStatusTimer = scene.time.delayedCall(1800, () => {
    scene.interactionStatus?.setVisible(false)
  })
}

export function sitAtInteractable(scene: MainScene, interactable: Interactable) {
  if (!scene.player) return
  scene.preSeatX = scene.player.x
  scene.preSeatY = scene.player.y

  const seat = nearestWalkable(scene, interactable.seatX, interactable.seatY, 3)
    ?? { x: interactable.seatX, y: interactable.seatY }

  scene.isSeated = true
  scene.seatedInteractable = interactable
  scene.player.setVelocity(0, 0)
  scene.player.setPosition(seat.x, seat.y)
  scene.player.setFrame(CHAR_CONFIGS[scene.charKey].sitFrame)
  setCollisionEnabled(scene, false)
}

export function standUpFromSeat(scene: MainScene) {
  if (!scene.player || !scene.isSeated) return
  scene.isSeated = false
  setCollisionEnabled(scene, true)

  const baseX = scene.seatedInteractable?.seatX ?? scene.player.x
  const baseY = scene.seatedInteractable?.seatY ?? scene.player.y

  const standPos =
    nearestWalkable(scene, scene.preSeatX, scene.preSeatY, 6) ??
    nearestWalkable(scene, baseX, baseY + scene.tileHeight * 0.9, 4) ??
    nearestWalkable(scene, scene.player.x, scene.player.y, 8) ??
    nearestWalkable(scene, scene.lastSafeX, scene.lastSafeY, 5) ??
    { x: scene.lastSafeX, y: scene.lastSafeY }

  scene.player.setPosition(standPos.x, standPos.y)
  scene.player.setVelocity(0, 0)
  scene.player.play(idleAnimKey(scene.charKey), true)
  scene.lastSafeX = standPos.x
  scene.lastSafeY = standPos.y
  scene.seatedInteractable = undefined
}

export function rescueIfEmbedded(scene: MainScene) {
  if (!scene.player) return
  const body = scene.player.body as Phaser.Physics.Arcade.Body | undefined
  if (!body?.embedded) return

  scene.isSeated = false
  scene.seatedInteractable = undefined
  setCollisionEnabled(scene, true)

  const spawn = findSpawnPoint(
    scene.roomByTile, scene.mapWidthInTiles, scene.mapHeightInTiles,
    scene.tileWidth, scene.tileHeight,
  )
  const rescue =
    nearestWalkable(scene, scene.lastSafeX, scene.lastSafeY, 8) ??
    nearestWalkable(scene, scene.player.x, scene.player.y, 10) ??
    spawn

  scene.player.setPosition(rescue.x, rescue.y)
  body.reset(rescue.x, rescue.y)
  scene.player.play(idleAnimKey(scene.charKey), true)
  scene.lastSafeX = rescue.x
  scene.lastSafeY = rescue.y
  showInteractionStatus(scene, "Adjusted position")
}

export function getPlayerFeet(scene: MainScene): { x: number; y: number } | undefined {
  if (!scene.player) return undefined
  const body = scene.player.body as Phaser.Physics.Arcade.Body | undefined
  if (!body) return { x: scene.player.x, y: scene.player.y }
  return { x: body.center.x, y: body.bottom - 1 }
}

export function updateInteractionPrompt(scene: MainScene): Interactable | undefined {
  if (!scene.interactionPrompt) return undefined

  if (scene.isSeated) {
    scene.interactionPrompt.setText("[E] Stand Up")
    scene.interactionPrompt.setVisible(true)
    return scene.activeInteractable
  }

  const feet = getPlayerFeet(scene)
  const nearest = feet
    ? findNearestInteractable(scene.interactables, feet.x, feet.y)
    : undefined

  if (!nearest) {
    scene.interactionPrompt.setVisible(false)
    return undefined
  }

  const verb = getInteractableVerb(nearest.kind)
  const label = getInteractableLabel(nearest.kind)
  scene.interactionPrompt.setText(`[E] ${verb} ${label}`)
  scene.interactionPrompt.setVisible(true)
  return nearest
}

export function handleInteraction(scene: MainScene) {
  if (!scene.player) return

  if (scene.isSeated) {
    standUpFromSeat(scene)
    showInteractionStatus(scene, "Stood up")
    return
  }

  if (!scene.activeInteractable) return

  const label = getInteractableLabel(scene.activeInteractable.kind)
  if (scene.activeInteractable.canSit) {
    sitAtInteractable(scene, scene.activeInteractable)
    showInteractionStatus(scene, `Sitting at ${label}`)
    return
  }

  if (scene.activeInteractable.kind === "Whiteboard") {
    showInteractionStatus(scene, `Reading ${label}`)
    return
  }

  showInteractionStatus(scene, "Bought a snack")
}
