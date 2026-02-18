import SignIn from "@/components/auth/SigninForm"
import Hero3D from "@/components/home/hero-3d"

export default function SignInPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">

      <div className="absolute inset-0 z-0">
        <Hero3D />
      </div>

      <div className="relative z-20 flex min-h-screen items-center justify-center">
        <SignIn />
      </div>

    </div>
  )
}
