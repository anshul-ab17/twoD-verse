import Phaser from "phaser"
import { CHAR_KEYS, CHAR_CONFIGS } from "../constants"
import { idleAnimKey, runAnimKey } from "../charUtils"

export function ensurePlayerAnimations(scene: Phaser.Scene): void {
  for (const key of CHAR_KEYS) {
    const cfg = CHAR_CONFIGS[key]

    if (!scene.anims.exists(idleAnimKey(key))) {
      scene.anims.create({
        key: idleAnimKey(key),
        frames: scene.anims.generateFrameNames(key, { prefix: cfg.idlePrefix, start: 1, end: 24, suffix: ".png" }),
        frameRate: 10,
        repeat: -1,
      })
    }

    if (!scene.anims.exists(runAnimKey(key))) {
      scene.anims.create({
        key: runAnimKey(key),
        frames: scene.anims.generateFrameNames(key, { prefix: cfg.runPrefix, start: 1, end: 24, suffix: ".png" }),
        frameRate: 18,
        repeat: -1,
      })
    }
  }
}
