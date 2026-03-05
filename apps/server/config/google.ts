import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import type { Profile } from "passport-google-oauth20"
import { client } from "@repo/db"
import { signAccessToken } from "@repo/auth"

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        "http://localhost:3001/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value
        if (!email) {
          return done(new Error("No email from Google"), undefined)
        }
 
        let user = await client.user.findUnique({
          where: { email },
          include: { accounts: true },
        })
 
        if (!user) {
          user = await client.user.create({
            data: { email },
            include: { accounts: true },
          })
        }

        const existingAccount = await client.account.findFirst({
          where: {
            provider: "GOOGLE",
            providerId: profile.id,
          },
        })

        if (!existingAccount) {
          await client.account.create({
            data: {
              userId: user.id,
              provider: "GOOGLE",
              providerId: profile.id,
            },
          })
        }

        const accessToken = signAccessToken(
          user.id,
          user.role
        )

        return done(null, {
          userId: user.id,
          role: user.role,
          accessToken,
        })
      } catch (err) {
        return done(err as Error, undefined)
      }
    }
  )
)