import Phaser from "phaser"

export function clampPlayerSpriteToWorld(
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  worldMinX: number,
  worldMinY: number,
  worldMaxX: number,
  worldMaxY: number,
) {
  const minX = worldMinX + player.displayWidth * player.originX
  const maxX = worldMaxX - player.displayWidth * (1 - player.originX)
  const minY = worldMinY + player.displayHeight * player.originY
  const maxY = worldMaxY - player.displayHeight * (1 - player.originY)
  player.x = Phaser.Math.Clamp(player.x, minX, maxX)
  player.y = Phaser.Math.Clamp(player.y, minY, maxY)
}

export function updateCameraMotion(
  camera: Phaser.Cameras.Scene2D.Camera,
  cameraLookX: number,
  cameraLookY: number,
  vx: number,
  vy: number,
  isSeated: boolean,
): { lookX: number; lookY: number } {
  const targetZoom  = isSeated ? 1.52 : (vx !== 0 || vy !== 0) ? 1.48 : 1.44
  const targetLookX = isSeated ? 0 : Phaser.Math.Clamp(vx / 200, -1, 1) * 44
  const targetLookY = isSeated ? 0 : Phaser.Math.Clamp(vy / 200, -1, 1) * 28

  const nextLookX = Phaser.Math.Linear(cameraLookX, targetLookX, 0.12)
  const nextLookY = Phaser.Math.Linear(cameraLookY, targetLookY, 0.12)

  camera.setFollowOffset(nextLookX, nextLookY)
  camera.setZoom(Phaser.Math.Linear(camera.zoom, targetZoom, 0.08))

  return { lookX: nextLookX, lookY: nextLookY }
}
