import passport from "passport"
import { Strategy as GitHubStrategy } from "passport-github2"
import type { Profile as GitHubProfile } from "passport-github2"
import { client } from "@repo/db"
import { signToken } from "@repo/auth"

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: "http://localhost:3002/api/auth/github/callback",
      scope: ["user:email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: GitHubProfile,
      done: (error: any, user?: any) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value

        if (!email) {
          return done(new Error("GitHub account has no email"))
        }

        let user = await client.user.findUnique({
          where: { email },
        })

        if (!user) {
          user = await client.user.create({
            data: {
              email,
              provider: "GITHUB",
            },
          })
        }

        if (user.provider !== "GITHUB") {
          return done(
            new Error("Account exists with different login method")
          )
        }

        const token = signToken(user.id)

        return done(null, { token })
      } catch (err) {
        return done(err)
      }
    }
  )
)