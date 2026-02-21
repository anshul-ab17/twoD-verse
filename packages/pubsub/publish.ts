import { pub, sub } from "./client"

const subscribedChannels = new Set<string>()

export async function publish(channel: string, payload: unknown) {
  await pub.publish(channel, JSON.stringify(payload))
}

export async function subscribe(
  channel: string,
  handler: (data: any) => void
) {
  if (subscribedChannels.has(channel)) return
  subscribedChannels.add(channel)

  await sub.subscribe(channel, (message: string) => {
    try {
      const parsed = JSON.parse(message)
      handler(parsed)
    } catch (err) {
      console.error("Invalid pubsub payload:", err)
    }
  })
}