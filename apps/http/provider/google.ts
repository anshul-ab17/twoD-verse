import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import type {
  Profile as GoogleProfile,
  VerifyCallback,
} from "passport-google-oauth20"
import { client } from "@repo/db"
import { signToken } from "@repo/auth"

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:3002/api/auth/google/callback",
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: GoogleProfile,
      done: VerifyCallback
    ) => {
      try {
        const email = profile.emails?.[0]?.value

        if (!email) {
          return done(new Error("Google account has no email"), undefined)
        }

        let user = await client.user.findUnique({
          where: { email },
        })

        if (!user) {
          user = await client.user.create({
            data: {
              email,
              provider: "GOOGLE",
            },
          })
        }

        if (user.provider !== "GOOGLE") {
          return done(
            new Error("Account exists with different login method"),
            undefined
          )
        }

        const token = signToken(user.id)

        return done(null, { token })
      } catch (err) {
        return done(err as Error, undefined)
      }
    }
  )
)