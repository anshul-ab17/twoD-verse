const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3002"

type ApiFetchOptions = RequestInit & {
  skipAuthRetry?: boolean
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(status: number, message: string, payload: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

async function readPayload(response: Response) {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return response.json()
  }

  const text = await response.text()
  return text || null
}

async function doFetch(path: string, options: ApiFetchOptions = {}) {
  const headers = new Headers(options.headers || {})
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(buildUrl(path), {
    ...options,
    headers,
    credentials: "include",
    cache: options.cache ?? "no-store",
  })
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  let response = await doFetch(path, options)

  const shouldRetryWithRefresh =
    response.status === 401 &&
    !options.skipAuthRetry &&
    path !== "/api/auth/signin" &&
    path !== "/api/auth/signup" &&
    path !== "/api/auth/refresh"

  if (shouldRetryWithRefresh) {
    const refreshResponse = await doFetch("/api/auth/refresh", {
      method: "POST",
      skipAuthRetry: true,
    })

    if (refreshResponse.ok) {
      response = await doFetch(path, {
        ...options,
        skipAuthRetry: true,
      })
    }
  }

  const payload = await readPayload(response)
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? String((payload as { error: string }).error)
        : `Request failed (${response.status})`
    throw new ApiError(response.status, message, payload)
  }

  return payload as T
}

export function getApiBaseUrl() {
  return API_BASE_URL
}

export function getWebSocketUrl() {
  const wsBase = API_BASE_URL.replace(/^http/, "ws")
  return `${wsBase}/ws`
}
