import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ key?: string }>
}

export default async function StatsPage({ searchParams }: Props) {
  const { key } = await searchParams
  if (!process.env.STATS_KEY || key !== process.env.STATS_KEY) {
    notFound()
  }

  const [profilesRes, tasksRes, completionsRes, recentProfilesRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('completions').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, created_at').order('created_at', { ascending: false }).limit(100),
  ])

  const profileCount = profilesRes.count ?? 0
  const taskCount = tasksRes.count ?? 0
  const completionCount = completionsRes.count ?? 0
  const recentProfiles = recentProfilesRes.data ?? []

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const newThisWeek = recentProfiles.filter(p => new Date(p.created_at) > sevenDaysAgo).length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = today.toISOString().slice(0, 10)
  const completionsTodayRes = await supabase
    .from('completions')
    .select('*', { count: 'exact', head: true })
    .eq('completed_date', todayIso)
  const completionsToday = completionsTodayRes.count ?? 0

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-light mb-2">Pown the Day · Stats</h1>
        <p className="text-white/40 text-sm mb-10">
          Aggregate counts only. No names, handles, or task content.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Stat label="Profiles" value={profileCount} />
          <Stat label="New (7 days)" value={newThisWeek} />
          <Stat label="Tasks" value={taskCount} />
          <Stat label="Completions" value={completionCount} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Stat label="Completed today" value={completionsToday} />
          <Stat label="Avg tasks/profile" value={profileCount ? (taskCount / profileCount).toFixed(1) : '0'} />
        </div>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <p className="text-white/40 text-xs uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-light">{value}</p>
    </div>
  )
}
