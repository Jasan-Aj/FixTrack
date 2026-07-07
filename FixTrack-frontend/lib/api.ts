const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || "Request failed")
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; user: import("@/types").User }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),
    register: (data: {
      email: string
      password: string
      name: string
      role?: string
      hostel_block?: string
      room_no?: string
    }) =>
      request<{ access_token: string; user: import("@/types").User }>(
        "/auth/register",
        { method: "POST", body: JSON.stringify(data) }
      ),
    me: () => request<import("@/types").User>("/auth/me"),
  },
  complaints: {
    list: () =>
      request<import("@/types").Complaint[]>("/complaints"),
    create: (data: Partial<import("@/types").Complaint>) =>
      request<import("@/types").Complaint>("/complaints", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: number, status: string) =>
      request<import("@/types").Complaint>(`/complaints/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    feedback: (id: number, rating: number, comment?: string) =>
      request<import("@/types").Feedback>(`/complaints/${id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      }),
  },    technicians: {
      tasks: () =>
        request<import("@/types").Complaint[]>("/technicians/tasks"),
      updateTaskStatus: (taskId: number, status: string) =>
        request<import("@/types").Complaint>(
          `/technicians/tasks/${taskId}/status?status=${status}`,
          { method: "PATCH" }
        ),
      profile: () =>
        request<import("@/types").Technician>("/technicians/profile"),
      toggleAvailability: (isAvailable: boolean) =>
        request<import("@/types").Technician>(
          `/technicians/availability?is_available=${isAvailable}`,
          { method: "PATCH" }
        ),
    },
  notifications: {
    list: () =>
      request<import("@/types").Notification[]>("/notifications"),
    unreadCount: () =>
      request<{ count: number }>("/notifications/unread-count"),
    markRead: (id: number) =>
      request<import("@/types").Notification>(
        `/notifications/${id}/read`,
        { method: "PATCH" }
      ),
    markAllRead: () =>
      request<void>("/notifications/read-all", { method: "PATCH" }),
  },
  upload: {
    image: (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null
      return fetch(
        `${API_BASE}/upload`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      ).then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({ detail: res.statusText }))
          throw new Error(error.detail || "Upload failed")
        }
        return res.json() as Promise<{ url: string; public_id: string }>
      })
    },
    images: (files: File[]) => {
      const formData = new FormData()
      files.forEach((f) => formData.append("files", f))
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null
      return fetch(
        `${API_BASE}/upload/batch`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      ).then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({ detail: res.statusText }))
          throw new Error(error.detail || "Upload failed")
        }
        return res.json() as Promise<{ url: string; public_id: string }[]>
      })
    },
  },
  admin: {
    users: {
      create: (data: { email: string; password: string; name: string; role: string; skills?: string[] }) =>
        request<import("@/types").User>("/admin/users", {
          method: "POST",
          body: JSON.stringify(data),
        }),
    },
    technicians: {
      list: () =>
        request<import("@/types").Technician[]>("/admin/technicians"),
      profile: (id: number) =>
        request<import("@/types").TechnicianProfile>(
          `/admin/technicians/${id}/profile`
        ),
      create: (data: { user_id: number; skills: string[] }) =>
        request<import("@/types").Technician>("/admin/technicians", {
          method: "POST",
          body: JSON.stringify(data),
        }),
      delete: (id: number) =>
        request<void>(`/admin/technicians/${id}`, { method: "DELETE" }),
    },
    complaints: {
      list: () =>
        request<import("@/types").Complaint[]>("/admin/complaints"),
      reassign: (id: number, technician_id: number) =>
        request<import("@/types").Complaint>(
          `/admin/complaints/${id}/reassign`,
          { method: "PATCH", body: JSON.stringify({ technician_id }) }
        ),
    },
    analytics: () =>
      request<import("@/types").Analytics>("/admin/analytics"),
  },
}
