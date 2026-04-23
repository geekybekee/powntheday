'use client'

import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/lib/types'

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

type Props = {
  task: Task
  isCompleted: boolean
  isPopping: boolean
  todayIndex: number
  animationDelay: number
  onToggleComplete: () => void
  onUpdateDays: (days: boolean[]) => void
  onToggleImportance: () => void
  onUpdateLabel: (label: string) => void
  onDelete: () => void
}

export function SortableTaskCard(props: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard {...props} dragListeners={listeners} dragAttributes={attributes} isDragging={isDragging} />
    </div>
  )
}

function TaskCard({
  task,
  isCompleted,
  isPopping,
  todayIndex,
  animationDelay,
  onToggleComplete,
  onUpdateDays,
  onToggleImportance,
  onUpdateLabel,
  onDelete,
  dragListeners,
  dragAttributes,
  isDragging,
}: Props & {
  dragListeners: ReturnType<typeof useSortable>['listeners']
  dragAttributes: ReturnType<typeof useSortable>['attributes']
  isDragging: boolean
}) {
  const [utilityOpen, setUtilityOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editLabel, setEditLabel] = useState(task.label)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) editInputRef.current?.select()
  }, [editing])

  function commitEdit() {
    const trimmed = editLabel.trim()
    if (trimmed && trimmed !== task.label) onUpdateLabel(trimmed)
    else setEditLabel(task.label)
    setEditing(false)
  }

  const isOffSchedule = !task.days[todayIndex]
  const isLow = task.importance === 'low'
  const isDimmed = (isOffSchedule || isLow) && !isCompleted

  function toggleDay(dayIndex: number) {
    const next = [...task.days]
    next[dayIndex] = !next[dayIndex]
    onUpdateDays(next)
  }

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <div
        className={`
          rounded-2xl border transition-all duration-300
          ${isCompleted
            ? 'bg-black/15 border-white/8'
            : isLow
              ? 'bg-black/15 border-white/10 backdrop-blur-md'
              : 'bg-white/10 border-white/18 backdrop-blur-md'}
          ${isDragging ? 'shadow-2xl scale-[1.02]' : ''}
        `}
        style={{ boxShadow: (isCompleted || isLow) ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
      >
        {/* Main row */}
        <div className="flex items-center gap-4 p-5">
          {/* Drag handle */}
          <button
            {...dragListeners}
            {...dragAttributes}
            className="shrink-0 text-white/18 hover:text-white/40 transition-colors cursor-grab active:cursor-grabbing touch-none"
            tabIndex={-1}
          >
            <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
              <circle cx="3" cy="3" r="1.5" />
              <circle cx="9" cy="3" r="1.5" />
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="9" cy="8" r="1.5" />
              <circle cx="3" cy="13" r="1.5" />
              <circle cx="9" cy="13" r="1.5" />
            </svg>
          </button>

          {/* Checkbox */}
          <button
            onClick={onToggleComplete}
            className={`
              shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center
              transition-all duration-300 cursor-pointer
              ${isPopping ? 'animate-check-pop' : ''}
              ${isCompleted ? 'border-white/35 bg-white/18' : 'border-white/28 bg-transparent hover:border-white/45'}
            `}
          >
            {isCompleted && (
              <svg className="w-3.5 h-3.5 text-white/65" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Label — double-click to edit */}
          {editing ? (
            <input
              ref={editInputRef}
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === 'Escape') { setEditLabel(task.label); setEditing(false) }
              }}
              className="flex-1 bg-transparent text-white/90 text-xl sm:text-2xl font-light outline-none border-b border-white/30 pb-0.5"
            />
          ) : (
            <span
              className="flex-1 text-xl sm:text-2xl font-light transition-all duration-500 select-none"
              style={{
                color: isCompleted ? 'rgba(255,255,255,0.28)' : isLow ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.92)',
                textDecoration: isCompleted ? 'line-through' : 'none',
                textShadow: (isCompleted || isLow) ? 'none' : '0 1px 6px rgba(0,0,0,0.3)',
                cursor: isCompleted ? 'default' : 'text',
              }}
              onClick={() => { if (!isCompleted) setEditing(true) }}
            >
              {task.label}
            </span>
          )}

          {/* Off-schedule badge */}
          {isOffSchedule && !isCompleted && !utilityOpen && (
            <span className="shrink-0 text-xs text-white/30 border border-white/18 rounded-full px-2 py-0.5">
              {DAY_ABBR.filter((_, i) => task.days[i]).join(' ') || 'none'}
            </span>
          )}

          {/* Utility toggle */}
          <button
            onClick={() => setUtilityOpen((o) => !o)}
            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-all cursor-pointer
              ${utilityOpen ? 'bg-white/15 text-white/70' : 'text-white/22 hover:text-white/50 hover:bg-white/10'}`}
          >
            <svg width="16" height="4" viewBox="0 0 16 4" fill="currentColor">
              <circle cx="2" cy="2" r="1.5" />
              <circle cx="8" cy="2" r="1.5" />
              <circle cx="14" cy="2" r="1.5" />
            </svg>
          </button>
        </div>

        {/* Utility bar */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${utilityOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="px-5 pb-4 flex flex-col gap-3 border-t border-white/10 pt-3 bg-black/20 rounded-b-2xl">
            {/* Day pills */}
            <div className="flex gap-1.5 flex-wrap">
              {DAY_ABBR.map((abbr, i) => (
                <button
                  key={abbr}
                  onClick={() => toggleDay(i)}
                  className={`
                    text-xs px-2.5 py-1.5 rounded-full border transition-all cursor-pointer font-medium
                    ${task.days[i]
                      ? 'bg-white/25 border-white/40 text-white'
                      : 'bg-white/5 border-white/20 text-white/45 hover:text-white/65 hover:border-white/30'}
                  `}
                >
                  {abbr}
                </button>
              ))}
            </div>

            {/* Importance + delete */}
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleImportance}
                className={`
                  text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer font-medium
                  ${isLow
                    ? 'bg-white/20 border-white/35 text-white/80'
                    : 'bg-white/5 border-white/20 text-white/45 hover:text-white/65 hover:border-white/30'}
                `}
              >
                {isLow ? '↓ Low priority' : 'Set low priority'}
              </button>

              <button
                onClick={onDelete}
                className="ml-auto text-xs text-red-200/50 hover:text-red-200/80 transition-colors cursor-pointer flex items-center gap-1 border border-red-300/20 hover:border-red-300/40 px-3 py-1.5 rounded-full"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
