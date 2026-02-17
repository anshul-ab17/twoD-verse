interface spaceLandingProps {
  userName: string
}

export default function Landing({ userName }: spaceLandingProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground px-6 text-center">

      <h1 className="text-4xl font-bold md:text-5xl">
        Hi, {userName}
      </h1>

      <p className="mt-6 max-w-xl text-muted-foreground text-lg">
        Your verse is empty.  
        Start shaping your world from here.
      </p>

      <div className="mt-10 flex gap-4">
        <button className="rounded-lg bg-foreground px-6 py-3 text-background transition hover:scale-105">
          Create New Space
        </button>

        <button className="rounded-lg border border-foreground px-6 py-3 transition hover:bg-foreground hover:text-background">
          Explore Templates
        </button>
      </div>
    </div>
  )
}
