import type { PersonalityType } from './starterTasks'

export type Profile = {
  id: string
  name: string
  personality_type: PersonalityType
  handle: string
  pin: string | null
  created_at: string
}

export type Task = {
  id: string
  profile_id: string
  label: string
  importance: 'normal' | 'low'
  days: boolean[] // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  sort_order: number
  is_starter: boolean
  created_at: string
}

export type Completion = {
  id: string
  task_id: string
  completed_date: string
  created_at: string
}
