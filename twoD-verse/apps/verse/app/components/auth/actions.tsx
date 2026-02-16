"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string

  const cookieStore = await cookies()

  cookieStore.set("twodverse-user", email, {
    httpOnly: true,
    path: "/",
  })

  redirect("/")
}
