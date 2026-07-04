// Generated ambient soundscape — WebAudio only, no audio assets (plan §27:
// everything owned; synthesis is owned by construction).
// ponytail: filtered brown noise + slow swell. Composed ambient tracks later.

let ctx: AudioContext | null = null
let gain: GainNode | null = null

export function ambientOn(): boolean {
  return ctx?.state === "running"
}

/** Toggle ambient; must be called from a user gesture (autoplay policy). */
export async function toggleAmbient(): Promise<boolean> {
  if (ctx) {
    if (ctx.state === "running") await ctx.suspend()
    else await ctx.resume()
    return ambientOn()
  }

  ctx = new AudioContext()
  // 4s brown-noise loop
  const len = ctx.sampleRate * 4
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.value = 420

  gain = ctx.createGain()
  gain.gain.value = 0.05

  // slow swell so it breathes instead of droning
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.05
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.02
  lfo.connect(lfoGain).connect(gain.gain)

  src.connect(filter).connect(gain).connect(ctx.destination)
  src.start()
  lfo.start()
  return true
}
