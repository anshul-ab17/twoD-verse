import * as Phaser from "phaser"

type RemotePlayer = {
  sprite: Phaser.Physics.Arcade.Sprite
}

const remotePlayers = new Map<string, RemotePlayer>()

export function setupMultiplayer(
  scene: Phaser.Scene,
  player: Phaser.Physics.Arcade.Sprite,
  userName: string
) {
  const socket = new WebSocket("ws://localhost:3001")

  const playerId = crypto.randomUUID()

  socket.onopen = () => {
    socket.send(JSON.stringify({
      type: "join",
      id: playerId,
      name: userName,
      x: player.x,
      y: player.y
    }))
  }

  scene.events.on("update", () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "move",
        id: playerId,
        x: player.x,
        y: player.y
      }))
    }
  })

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)

    if (data.id === playerId) return

    if (!remotePlayers.has(data.id)) {
      const sprite = scene.physics.add.sprite(data.x, data.y, "player")
      sprite.setTint(0xff0000)

      remotePlayers.set(data.id, { sprite })
    } else {
      const remote = remotePlayers.get(data.id)!
      remote.sprite.setPosition(data.x, data.y)
    }
  }
}
