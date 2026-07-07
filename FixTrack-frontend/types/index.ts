export type UserRole = "student" | "tech" | "admin"

export type ComplaintStatus = "pending" | "in_progress" | "completed" | "cancelled"

export type ComplaintCategory =
  | "plumbing"
  | "electrical"
  | "wifi"
  | "carpentry"
  | "cleaning"
  | "other"

export type Urgency = "high" | "medium" | "low"

export interface User {
  id: number
  email: string
  role: UserRole
  name: string
  hostel_block?: string
  room_no?: string
}

export interface Technician {
  id: number
  user_id: number
  skills: string[]
  is_available: boolean
  workload_count: number
  user?: User
}

export interface Complaint {
  id: number
  student_id: number
  title: string
  description: string
  category: ComplaintCategory
  urgency: Urgency
  hostel_block: string
  room_no: string
  image_urls: string[]
  status: ComplaintStatus
  assigned_to?: number
  created_at: string
  resolved_at?: string
  student?: User
  feedback?: Feedback
}

export interface Feedback {
  id: number
  complaint_id: number
  rating: number
  comment?: string
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  complaint_id?: number
  is_read: boolean
  created_at: string
}

export interface TechnicianProfile {
  id: number
  user_id: number
  skills: string[]
  is_available: boolean
  workload_count: number
  completed_count: number
  user?: User
}

export interface Analytics {
  complaints_by_category: Record<string, number>
  complaints_by_status: Record<string, number>
  avg_resolution_hours?: number
  technician_workload: {
    technician_id: number
    name: string
    workload_count: number
    is_available: boolean
  }[]
}
