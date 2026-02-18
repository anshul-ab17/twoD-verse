"use client"

export default function Grid() {
  return (
    <gridHelper args={[100, 100, "#222", "#111"]} rotation={[Math.PI / 2, 0, 0]} />
  )
}
