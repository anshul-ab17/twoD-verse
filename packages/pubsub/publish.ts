import { pub, sub } from "./client"

const subscribed = new Set<string>()

export async function publish(channel: string, payload: any) {
  await pub.publish(channel, JSON.stringify(payload))
}

export async function subscribe(channel: string, handler: (data: string) => void) {
  if (subscribed.has(channel)) return
  subscribed.add(channel)

  await sub.subscribe(channel, (message: string) => {
    handler(JSON.parse(message))
  })
}

