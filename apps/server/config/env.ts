// import "dotenv/config"

export const PORT = process.env.PORT ?? process.env.API_PORT
export const NODE_ENV = process.env.NODE_ENV || "development"
export const JWT_SECRET = process.env.JWT_SECRET!
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!

export const TURN_URL = process.env.TURN_URL ?? ""
export const TURN_USERNAME = process.env.TURN_USERNAME ?? ""
export const TURN_CREDENTIAL = process.env.TURN_CREDENTIAL ?? ""
