import { Server } from "@colyseus/core"
import { WebSocketTransport } from "@colyseus/ws-transport"
import { WorldRoom } from "./WorldRoom"

const port = Number(process.env.PORT) || 2567

// @colyseus/core directly (not the colyseus meta-package): it drags in
// uwebsockets-transport whose git-hosted uWebSockets.js pnpm blocks.
const gameServer = new Server({ transport: new WebSocketTransport() })
gameServer.define("world", WorldRoom)

gameServer.listen(port).then(() => {
  console.log(`[realtime] listening on ws://localhost:${port}`)
})
