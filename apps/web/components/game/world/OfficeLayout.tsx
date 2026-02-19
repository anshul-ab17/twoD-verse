import Phaser from "phaser"

export function buildOffice(scene: Phaser.Scene) {
  const desks = scene.physics.add.staticGroup()

  // Top row rooms
  scene.add.rectangle(300, 150, 400, 250, 0x2a2a2a) // Room1
  scene.add.rectangle(800, 150, 400, 250, 0x2a2a2a) // Room2
  scene.add.rectangle(1400, 150, 800, 250, 0x333333) // Meeting

  // Middle
  scene.add.rectangle(400, 600, 600, 300, 0x3a3a3a) // Kitchen
  scene.add.rectangle(1300, 600, 800, 300, 0x2f2f2f) // Workspace

  // Bottom
  scene.add.rectangle(250, 1050, 300, 250, 0x444444) // Lobby
  scene.add.rectangle(650, 1050, 300, 250, 0x555555) // Lounge
  scene.add.rectangle(1100, 1050, 300, 250, 0x2a2a2a) // Room3
  scene.add.rectangle(1500, 1050, 300, 250, 0x2a2a2a) // Room4

  // 6 desks
  const positions = [
    [1100, 600],
    [1250, 600],
    [1400, 600],
    [1100, 750],
    [1250, 750],
    [1400, 750],
  ]

  positions.forEach(([x, y]) => {
    const desk = desks.create(x, y, undefined as any)
    desk.setDisplaySize(100, 50)
    desk.setTint(0x8b5e3c)
    desk.refreshBody()
  })

  return desks
}
