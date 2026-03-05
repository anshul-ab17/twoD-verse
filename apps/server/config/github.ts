import passport from "passport"
import { Strategy as GitHubStrategy } from "passport-github2"
import type { Profile } from "passport-github2"
import { client } from "@repo/db"
import { signAccessToken } from "@repo/auth"

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GitHub_CLIENT_ID!,
      clientSecret: process.env.GitHub_CLIENT_SECRET!,
      callbackURL:
        "http://localhost:3001/api/auth/GitHub/callback",
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (error: any, user?: Express.User | false) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value
        if (!email) {
          return done(new Error("No email"), false)
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
            provider: "GITHUB",
            providerId: profile.id,
          },
        })

        if (!existingAccount) {
          await client.account.create({
            data: {
              userId: user.id,
              provider: "GITHUB",
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
        return done(err as Error, false)
      }
    }
  )
)