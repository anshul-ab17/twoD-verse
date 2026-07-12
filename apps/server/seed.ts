import "dotenv/config"
import { client } from "@repo/db"
import { hashPassword } from "@repo/auth"

async function seed() {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    throw new Error("TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env")
  }

  const hashed = await hashPassword(password)

  await client.user.upsert({
    where: { email },
    create: { email, password: hashed, role: "user" },
    update: {},
  })

  console.log(`Seed complete: ${email}`)
  await client.$disconnect()
}

void seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
