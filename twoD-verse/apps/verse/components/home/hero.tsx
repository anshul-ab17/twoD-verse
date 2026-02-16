import Link from "next/link"

interface HomeProps {
  isAuthenticated: boolean
}

export default function Home({ isAuthenticated }: HomeProps) {
  const href = isAuthenticated ? "/space" : "/signin"

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col text-white overflow-hidden">

      {/* Background Image */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 -z-10 bg-black/60" />

      {/* Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Create Your Verse
        </h2>

        <p className="mt-6 max-w-xl text-lg text-white/80">
          Build your digital space. Shape your ideas.
        </p>

        <Link
          href={href}
          className="mt-8 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          Start Now
        </Link>
      </div>
    </div>
  )
}
