// import "dotenv/config"

export const PORT = process.env.API_PORT || 3002
export const NODE_ENV = process.env.NODE_ENV || "development"
export const JWT_SECRET = process.env.JWT_SECRET!
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!