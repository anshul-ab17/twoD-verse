// Real access token via gateway signup of a throwaway user (gateway must be
// running on :2569). Keeps spikes honest: same JWT path as production.
const GATEWAY = process.env.GATEWAY_URL ?? "http://localhost:2569"

export async function freshToken(): Promise<string> {
  const email = `spike-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`
  const res = await fetch(`${GATEWAY}/v1/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "Spike-passw0rd!" }),
  })
  if (!res.ok) throw new Error(`gateway signup failed: ${res.status} ${await res.text()}`)
  const { accessToken } = (await res.json()) as { accessToken: string }
  return accessToken
}
