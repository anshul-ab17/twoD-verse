"use client"

export default function CreateSpacePage() {
  return (
    <div className="max-w-xl text-white">

      <div className="bg-[#8B5A2B] p-8 rounded-2xl border border-[#5A3B1C] shadow-xl">

        <h1 className="text-2xl font-bold text-yellow-200 mb-6">
          Create New Space
        </h1>

        <input
          placeholder="Space Name"
          className="w-full p-3 rounded-lg text-black mb-4"
        />

        <button
          className="w-full py-3 bg-[#556B2F] hover:bg-[#6B8E23]
                     rounded-lg font-semibold transition"
        >
          Create Space
        </button>

      </div>

    </div>
  )
}