import type { RequestHandler } from "express"
import { client } from "@repo/db"

function canonicalPair(a: string, b: string) {
  return a < b
    ? { userAId_userBId: { userAId: a, userBId: b } }
    : { userAId_userBId: { userAId: b, userBId: a } }
}

function canonicalData(a: string, b: string) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a }
}

export const getFriends: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })
  const userId = req.user.userId

  const friendships = await client.friendship.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, email: true } },
      userB: { select: { id: true, email: true } },
    },
  })

  const friends = friendships.map((f) => {
    const friend = f.userAId === userId ? f.userB : f.userA
    return { id: friend.id, email: friend.email, name: friend.email.split("@")[0] }
  })

  return res.json({ friends })
}

export const sendFriendRequest: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })
  const senderId = req.user.userId
  const { targetUserId } = req.body as { targetUserId?: string }
  if (!targetUserId || targetUserId === senderId) {
    return res.status(400).json({ error: "Invalid target" })
  }

  const existing = await client.friendship.findUnique({ where: canonicalPair(senderId, targetUserId) })
  if (existing) return res.json({ status: "already_friends" })

  const reverse = await client.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId: targetUserId, receiverId: senderId } },
  })
  if (reverse && reverse.status === "PENDING") {
    await client.$transaction([
      client.friendRequest.update({ where: { id: reverse.id }, data: { status: "ACCEPTED" } }),
      client.friendship.create({ data: canonicalData(senderId, targetUserId) }),
    ])
    return res.json({ status: "accepted" })
  }

  const request = await client.friendRequest.upsert({
    where: { senderId_receiverId: { senderId, receiverId: targetUserId } },
    create: { senderId, receiverId: targetUserId, status: "PENDING" },
    update: { status: "PENDING" },
  })

  return res.status(201).json({ request })
}

export const getPendingRequests: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })

  const requests = await client.friendRequest.findMany({
    where: { receiverId: req.user.userId, status: "PENDING" },
    include: { sender: { select: { id: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })

  return res.json({
    requests: requests.map((r) => ({
      id: r.id,
      senderId: r.senderId,
      senderEmail: r.sender.email,
      senderName: r.sender.email.split("@")[0],
      createdAt: r.createdAt,
    })),
  })
}

export const respondToRequest: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })
  const requestId = req.params.requestId as string
  const { action } = req.body as { action?: "accept" | "reject" }
  if (!action || !["accept", "reject"].includes(action)) {
    return res.status(400).json({ error: "action must be accept or reject" })
  }

  const request = await client.friendRequest.findUnique({ where: { id: requestId } })
  if (!request || request.receiverId !== req.user.userId) {
    return res.status(404).json({ error: "Request not found" })
  }
  if (request.status !== "PENDING") {
    return res.status(409).json({ error: "Request already resolved" })
  }

  if (action === "reject") {
    await client.friendRequest.update({ where: { id: requestId }, data: { status: "REJECTED" } })
    return res.json({ status: "rejected" })
  }

  await client.$transaction([
    client.friendRequest.update({ where: { id: requestId }, data: { status: "ACCEPTED" } }),
    client.friendship.upsert({
      where: canonicalPair(request.senderId, request.receiverId),
      create: canonicalData(request.senderId, request.receiverId),
      update: {},
    }),
  ])
  return res.json({ status: "accepted" })
}

export const removeFriend: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })
  const userId = req.user.userId
  const targetId = req.params.userId as string
  if (!targetId) return res.status(400).json({ error: "Missing userId" })

  await client.friendship.deleteMany({ where: canonicalData(userId, targetId) })

  await client.friendRequest.updateMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: userId, receiverId: targetId },
        { senderId: targetId, receiverId: userId },
      ],
    },
    data: { status: "REJECTED" },
  })

  return res.json({ success: true })
}
