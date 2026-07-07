import type { User } from "@/types"

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("user")
  return raw ? JSON.parse(raw) : null
}

export function setStoredUser(user: User, token: string) {
  localStorage.setItem("user", JSON.stringify(user))
  localStorage.setItem("token", token)
  // Set cookie for middleware access (expires in 24h)
  document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`
}

export function clearStoredUser() {
  localStorage.removeItem("user")
  localStorage.removeItem("token")
  document.cookie = "token=; path=/; max-age=0"
}

export function isAuthenticated(): boolean {
  return !!getStoredUser()
}

export function getUserRole(): string | null {
  return getStoredUser()?.role ?? null
}
