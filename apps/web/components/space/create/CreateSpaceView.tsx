"use client"

export default function CreateSpaceView({
  createSpace,
}: {
  createSpace: (formData: FormData) => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        action={createSpace}
        className="space-y-4 w-80"
      >
        <h1 className="text-xl font-semibold">
          Create Space
        </h1>

        <input
          name="name"
          className="w-full bg-neutral-800 p-2 rounded outline-none"
          placeholder="Space name"
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 py-2 rounded hover:bg-indigo-500"
        >
          Create Space
        </button>
      </form>
    </div>
  )
}
