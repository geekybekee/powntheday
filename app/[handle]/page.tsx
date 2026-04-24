'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { supabase } from '@/lib/supabase'
import { getSkyGradient, getSkyGradientFromCoords, getSunAltitude, getGreeting } from '@/lib/sky'
import { fetchWeather, getWeatherOverlay, type WeatherData } from '@/lib/weather'
import { validateTaskLabel } from '@/lib/validate'
import { SortableTaskCard } from '@/components/TaskCard'
import { WeatherEffects } from '@/components/WeatherEffects'
import type { Profile, Task } from '@/lib/types'

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function DailyView() {
  const { handle } = useParams<{ handle: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [poppingIds, setPoppingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskLabel, setNewTaskLabel] = useState('')
  const [savingTask, setSavingTask] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [now, setNow] = useState(new Date())
  const [testHour, setTestHour] = useState<number | null>(null)
  const [testWeatherCode, setTestWeatherCode] = useState<number | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)
  const isDev = process.env.NODE_ENV === 'development'

  const effectiveDate = testHour !== null
    ? new Date(new Date(now).setHours(testHour, 0, 0, 0))
    : now
  const hour = effectiveDate.getHours()
  const todayIndex = now.getDay()
  const todayDate = getTodayDate()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(c)
        try {
          const w = await fetchWeather(c.lat, c.lng)
          setWeather(w)
        } catch {
          // weather unavailable — silent fail
        }
      },
      () => {} // location denied — fall back to hour-based gradient
    )
  }, [])

  useEffect(() => {
    async function load() {
      const [profileRes, tasksRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('handle', handle).single(),
        supabase.from('tasks').select('*').order('sort_order'),
      ])

      if (profileRes.error || !profileRes.data) { setLoading(false); return }

      const loadedProfile: Profile = profileRes.data
      setProfile(loadedProfile)

      const loadedTasks: Task[] = (tasksRes.data ?? []).filter(
        (t) => t.profile_id === loadedProfile.id
      )
      setTasks(loadedTasks)

      if (loadedTasks.length > 0) {
        const { data: completions } = await supabase
          .from('completions')
          .select('task_id')
          .in('task_id', loadedTasks.map((t) => t.id))
          .eq('completed_date', todayDate)

        if (completions) setCompletedIds(new Set(completions.map((c) => c.task_id)))
      }

      setLoading(false)
    }

    load()
  }, [handle, todayDate])

  useEffect(() => {
    if (addingTask) addInputRef.current?.focus()
  }, [addingTask])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeTasks = tasks
      .filter((t) => !completedIds.has(t.id))
      .sort((a, b) => a.sort_order - b.sort_order)

    const oldIndex = activeTasks.findIndex((t) => t.id === active.id)
    const newIndex = activeTasks.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reorderedActive = arrayMove(activeTasks, oldIndex, newIndex)
      .map((task, i) => ({ ...task, sort_order: i }))
    const completedTasks = tasks.filter((t) => completedIds.has(t.id))

    setTasks([...reorderedActive, ...completedTasks])
    await supabase.from('tasks').upsert(reorderedActive)
  }

  async function toggleCompletion(taskId: string) {
    const isCompleted = completedIds.has(taskId)

    setPoppingIds((prev) => new Set([...prev, taskId]))
    setTimeout(() => setPoppingIds((prev) => { const n = new Set(prev); n.delete(taskId); return n }), 350)

    if (isCompleted) {
      setCompletedIds((prev) => { const n = new Set(prev); n.delete(taskId); return n })
      await supabase.from('completions').delete().eq('task_id', taskId).eq('completed_date', todayDate)
    } else {
      setCompletedIds((prev) => new Set([...prev, taskId]))
      await supabase.from('completions').insert({ task_id: taskId, completed_date: todayDate })
    }
  }

  async function updateTaskDays(taskId: string, days: boolean[]) {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, days } : t))
    await supabase.from('tasks').update({ days }).eq('id', taskId)
  }

  async function updateTaskLabel(taskId: string, label: string) {
    const trimmed = label.trim().slice(0, 200)
    if (!trimmed) return
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, label: trimmed } : t))
    await supabase.from('tasks').update({ label: trimmed }).eq('id', taskId)
  }

  async function toggleImportance(taskId: string) {
    let nextImportance: 'normal' | 'low' = 'normal'
    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t
      nextImportance = t.importance === 'low' ? 'normal' : 'low'
      return { ...t, importance: nextImportance }
    }))
    await supabase.from('tasks').update({ importance: nextImportance }).eq('id', taskId)
  }

  async function deleteProfile() {
    if (!profile) return
    const taskIds = await supabase
      .from('tasks')
      .select('id')
      .eq('profile_id', profile.id)
      .then(({ data }) => (data ?? []).map((t) => t.id))

    if (taskIds.length > 0) {
      await supabase.from('completions').delete().in('task_id', taskIds)
      await supabase.from('tasks').delete().eq('profile_id', profile.id)
    }

    await supabase.from('profiles').delete().eq('id', profile.id)
    router.push('/')
  }

  async function deleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    await supabase.from('tasks').delete().eq('id', taskId)
  }

  async function addTask() {
    const err = validateTaskLabel(newTaskLabel)
    if (err || !profile || savingTask) return
    setSavingTask(true)
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.sort_order), -1)
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        profile_id: profile.id,
        label: newTaskLabel.trim().slice(0, 200),
        importance: 'normal',
        days: [true, true, true, true, true, true, true],
        sort_order: maxOrder + 1,
        is_starter: false,
      })
      .select()
      .single()

    if (!error && task) {
      setTasks((prev) => [...prev, task])
      setNewTaskLabel('')
      setAddingTask(false)
    }
    setSavingTask(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: getSkyGradient(hour) }}>
        <p className="text-white/30 text-xl font-light">Loading...</p>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: getSkyGradient(hour) }}>
        <p className="text-white/50 text-xl">Profile not found.</p>
      </main>
    )
  }

  const sorted = [...tasks].sort((a, b) => {
    const aCompleted = completedIds.has(a.id) ? 1 : 0
    const bCompleted = completedIds.has(b.id) ? 1 : 0
    if (aCompleted !== bCompleted) return aCompleted - bCompleted
    return a.sort_order - b.sort_order
  })

  const skyGradient = coords
    ? getSkyGradientFromCoords(effectiveDate, coords.lat, coords.lng)
    : getSkyGradient(hour)

  const altDeg = coords ? getSunAltitude(effectiveDate, coords.lat, coords.lng) : null
  const isNight = altDeg !== null ? altDeg < -6 : hour < 6 || hour > 20

  const effectiveWeather: WeatherData | null = testWeatherCode !== null
    ? {
        weatherCode: testWeatherCode,
        cloudCover: testWeatherCode === 0 ? 0 : testWeatherCode <= 3 ? 25 : 90,
        precipitation: testWeatherCode >= 51 ? 1.5 : 0,
        isDay: !isNight,
        description: 'Test',
      }
    : weather

  const weatherOverlay = getWeatherOverlay(effectiveWeather)
  const headerTextShadow = '0 1px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)'

  return (
    <main className="min-h-screen flex flex-col relative" style={{ background: skyGradient }}>
      {weatherOverlay && (
        <div
          className="fixed inset-0 pointer-events-none transition-all duration-[3000ms]"
          style={{ backgroundColor: weatherOverlay.color, opacity: weatherOverlay.opacity }}
        />
      )}
      <WeatherEffects weather={effectiveWeather} isNight={isNight} />

      <div
        className="relative z-10 pt-14 pb-10 text-center px-6 animate-fade-in-up"
        style={{ textShadow: headerTextShadow }}
      >
        <p className="text-white/55 text-sm uppercase tracking-[0.2em] mb-1">
          {formatDate(now)}
        </p>
        <p className="text-white/45 text-base mb-7">
          {formatTime(now)}
          {effectiveWeather && (
            <span className="text-white/30 ml-2">· {effectiveWeather.description}</span>
          )}
        </p>
        <h1
          className="text-white text-4xl sm:text-6xl tracking-tight mb-4"
          style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', fontWeight: 400 }}
        >
          {getGreeting(profile.name, hour)}
        </h1>
        <p className="text-white/50 text-lg sm:text-xl font-light">
          What do you want to accomplish today?
        </p>
      </div>

      <div className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-6 pb-32 flex flex-col gap-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {sorted.map((task, i) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                isCompleted={completedIds.has(task.id)}
                isPopping={poppingIds.has(task.id)}
                todayIndex={todayIndex}
                animationDelay={i * 0.06}
                onToggleComplete={() => toggleCompletion(task.id)}
                onUpdateDays={(days) => updateTaskDays(task.id, days)}
                onToggleImportance={() => toggleImportance(task.id)}
                onUpdateLabel={(label) => updateTaskLabel(task.id, label)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {addingTask ? (
          <div
            className="animate-fade-in-up flex items-center gap-3 p-5 rounded-2xl bg-white/10 border border-white/18 backdrop-blur-md"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
          >
            <div className="shrink-0 w-7 h-7 rounded-full border-2 border-white/20" />
            <input
              ref={addInputRef}
              type="text"
              value={newTaskLabel}
              onChange={(e) => setNewTaskLabel(e.target.value.slice(0, 200))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTask()
                if (e.key === 'Escape') { setAddingTask(false); setNewTaskLabel('') }
              }}
              placeholder="What else?"
              maxLength={200}
              className="flex-1 bg-transparent text-white/90 text-xl sm:text-2xl font-light placeholder-white/22 outline-none"
            />
            <button onClick={addTask} disabled={!newTaskLabel.trim() || savingTask}
              className="text-white/40 hover:text-white/70 text-sm transition-colors disabled:opacity-30 cursor-pointer">
              Add
            </button>
            <button onClick={() => { setAddingTask(false); setNewTaskLabel('') }}
              className="text-white/22 hover:text-white/45 text-sm transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="animate-fade-in-up w-full flex items-center gap-5 p-5 rounded-2xl border border-dashed border-white/20 bg-black/20 backdrop-blur-md hover:bg-black/28 transition-all cursor-pointer text-left"
            style={{ animationDelay: `${sorted.length * 0.06}s` }}
          >
            <div className="shrink-0 w-7 h-7 rounded-full border-2 border-dashed border-white/25 flex items-center justify-center text-white/40 text-lg leading-none">
              +
            </div>
            <span className="text-white/40 text-xl font-light">Add something...</span>
          </button>
        )}
      </div>

      <div className="fixed bottom-2 left-0 right-0 flex justify-center items-center gap-3 z-10">
        <p className="text-white/18 text-[10px] tracking-widest uppercase">
          © {new Date().getFullYear()} Rabbit Hole Ventures
        </p>
        <a
          href="https://ko-fi.com/powntheday"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/18 hover:text-white/40 text-[10px] tracking-widest uppercase transition-colors"
        >
          ☕ Buy me a coffee
        </a>
      </div>

      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-10 gap-3">
        <button
          onClick={() => router.push('/')}
          className="text-white/55 hover:text-white/80 text-sm transition-colors cursor-pointer bg-black/25 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-black/35"
        >
          ← Switch profile
        </button>
        <button
          onClick={() => {
            if (confirmDelete) {
              deleteProfile()
            } else {
              setConfirmDelete(true)
              setTimeout(() => setConfirmDelete(false), 3000)
            }
          }}
          className={`text-sm transition-all cursor-pointer backdrop-blur-md px-4 py-2 rounded-full border
            ${confirmDelete
              ? 'text-red-300/90 bg-red-900/40 border-red-400/30 hover:bg-red-900/60'
              : 'text-white/30 bg-black/25 border-white/10 hover:text-white/55 hover:bg-black/35'
            }`}
        >
          {confirmDelete ? 'Delete profile?' : 'Delete'}
        </button>
      </div>

      {isDev && (
        <>
          <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-20">
            <label className="text-white/30 text-xs">hour: {testHour ?? now.getHours()}</label>
            <input type="range" min={0} max={23} value={testHour ?? now.getHours()}
              onChange={(e) => setTestHour(Number(e.target.value))}
              className="w-32 accent-white/50" />
            {testHour !== null && (
              <button onClick={() => setTestHour(null)} className="text-white/25 hover:text-white/50 text-xs cursor-pointer">
                reset hour
              </button>
            )}
            <select
              value={testWeatherCode ?? ''}
              onChange={(e) => setTestWeatherCode(e.target.value === '' ? null : Number(e.target.value))}
              className="mt-1 bg-black/40 text-white/50 text-xs rounded px-2 py-1 border border-white/15 cursor-pointer outline-none"
            >
              <option value="">real weather</option>
              <option value="0">Clear</option>
              <option value="61">Rain</option>
              <option value="73">Snow</option>
              <option value="95">Storm</option>
            </select>
          </div>
        </>
      )}
    </main>
  )
}
