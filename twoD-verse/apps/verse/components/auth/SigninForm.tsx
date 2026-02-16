import { signIn } from "@/lib/auth"

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col gap-4">
        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/" })
          }}
        >
          <button className="rounded border px-6 py-3">
            Continue with Google
          </button>
        </form>

        <form
          action={async () => {
            "use server"
            await signIn("github", { redirectTo: "/" })
          }}
        >
          <button className="rounded bg-black px-6 py-3 text-white">
            Continue with GitHub
          </button>
        </form>
      </div>
    </div>
  )
}
