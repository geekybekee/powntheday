'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PERSONALITY_TYPES, STARTER_TASKS, type PersonalityType } from '@/lib/starterTasks'
import { getSkyGradient } from '@/lib/sky'
import { validateName, validateHandle, validateTaskLabel, sanitizeHandle } from '@/lib/validate'

type Step = 'name' | 'type' | 'handle' | 'pin'

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [selectedType, setSelectedType] = useState<PersonalityType | null>(null)
  const [handle, setHandle] = useState('')
  const [handleError, setHandleError] = useState('')
  const [checkingHandle, setCheckingHandle] = useState(false)
  const [pin, setPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const pinInputRef = useRef<HTMLInputElement>(null)
  const handleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'pin') pinInputRef.current?.focus()
    if (step === 'handle') handleInputRef.current?.focus()
  }, [step])

  function handleNameContinue() {
    const err = validateName(name)
    if (err) { setNameError(err); return }
    setNameError('')
    setHandle(sanitizeHandle(name))
    setStep('type')
  }

  function handleTypeSelect(type: PersonalityType) {
    setSelectedType(type)
    setStep('handle')
  }

  function handleHandleChange(value: string) {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30)
    setHandle(cleaned)
    setHandleError(validateHandle(cleaned) ?? '')
  }

  async function handleHandleContinue() {
    const err = validateHandle(handle)
    if (err) { setHandleError(err); return }

    setCheckingHandle(true)
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .maybeSingle()
    setCheckingHandle(false)

    if (data) {
      setHandleError('Already taken — try another')
      return
    }

    setHandleError('')
    setStep('pin')
  }

  async function saveProfile(pinValue: string | null) {
    if (!selectedType || saving) return
    setSaving(true)
    setError('')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({ name: name.trim(), personality_type: selectedType, handle, pin: pinValue })
      .select()
      .single()

    if (profileError || !profile) {
      setError('Something went wrong. Please try again.')
      setSaving(false)
      return
    }

    const starterTasks = STARTER_TASKS[selectedType].map((task, index) => ({
      profile_id: profile.id,
      label: task.label.slice(0, 200),
      importance: task.importance,
      days: task.days,
      sort_order: index,
      is_starter: true,
    }))

    const { error: tasksError } = await supabase.from('tasks').insert(starterTasks)

    if (tasksError) {
      setError('Could not save tasks. Please try again.')
      setSaving(false)
      return
    }

    router.push(`/${handle}`)
  }

  function handlePinChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    setPin(digits)
    if (digits.length === 4) setTimeout(() => saveProfile(digits), 200)
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-8"
      style={{ background: getSkyGradient(new Date().getHours()) }}
    >
      {step === 'name' && (
        <div className="flex flex-col items-center gap-8 w-full max-w-md animate-fade-in-up">
          <h1 className="text-white text-4xl sm:text-5xl font-light tracking-tight text-center">
            What should we call you?
          </h1>
          <div className="w-full flex flex-col gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value.slice(0, 50)); setNameError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNameContinue() }}
              placeholder="Your name"
              autoFocus
              maxLength={50}
              className="w-full bg-white/10 border border-white/25 rounded-2xl px-6 py-4 text-white text-2xl placeholder-white/30 outline-none focus:border-white/50 focus:bg-white/15 transition-all text-center backdrop-blur-md"
            />
            {nameError && <p className="text-red-300/80 text-sm text-center">{nameError}</p>}
          </div>
          <button
            onClick={handleNameContinue}
            disabled={name.trim().length === 0}
            className="px-10 py-4 rounded-2xl bg-white/15 border border-white/25 text-white text-lg font-medium hover:bg-white/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Continue
          </button>
        </div>
      )}

      {step === 'type' && (
        <div className="flex flex-col items-center gap-10 w-full max-w-2xl animate-fade-in-up">
          <div className="text-center">
            <h1 className="text-white text-4xl sm:text-5xl font-light tracking-tight mb-3">
              Hey, {name}.
            </h1>
            <p className="text-white/50 text-xl font-light">
              Pick the type that fits best. You can always adjust.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            {(Object.entries(PERSONALITY_TYPES) as [PersonalityType, { label: string; description: string }][]).map(
              ([type, info]) => (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  disabled={saving}
                  className="flex flex-col gap-2 p-6 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 hover:scale-105 transition-all duration-200 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-white text-xl font-medium">{info.label}</span>
                  <span className="text-white/50 text-sm leading-relaxed">{info.description}</span>
                </button>
              )
            )}
          </div>

          <button
            onClick={() => setStep('name')}
            className="text-white/35 text-sm hover:text-white/60 transition-colors cursor-pointer"
          >
            ← Back
          </button>
        </div>
      )}

      {step === 'handle' && (
        <div className="flex flex-col items-center gap-8 w-full max-w-sm animate-fade-in-up">
          <div className="text-center">
            <h1 className="text-white text-4xl sm:text-5xl font-light tracking-tight mb-3">
              Pick a handle
            </h1>
            <p className="text-white/50 text-lg font-light">
              Your personal URL will be:
            </p>
            <p className="text-white/70 text-base mt-1 font-mono">
              powntheday.com/<span className="text-white">{handle || '…'}</span>
            </p>
          </div>

          <div className="w-full flex flex-col gap-2">
            <input
              ref={handleInputRef}
              type="text"
              value={handle}
              onChange={(e) => handleHandleChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleHandleContinue() }}
              placeholder="your-handle"
              maxLength={30}
              className="w-full bg-white/10 border border-white/25 rounded-2xl px-6 py-4 text-white text-2xl placeholder-white/30 outline-none focus:border-white/50 focus:bg-white/15 transition-all text-center backdrop-blur-md font-mono"
            />
            {handleError && <p className="text-red-300/80 text-sm text-center">{handleError}</p>}
          </div>

          <button
            onClick={handleHandleContinue}
            disabled={!handle || !!handleError || checkingHandle}
            className="px-10 py-4 rounded-2xl bg-white/15 border border-white/25 text-white text-lg font-medium hover:bg-white/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {checkingHandle ? 'Checking…' : 'Continue'}
          </button>

          <button
            onClick={() => setStep('type')}
            className="text-white/35 text-sm hover:text-white/60 transition-colors cursor-pointer"
          >
            ← Back
          </button>
        </div>
      )}

      {step === 'pin' && (
        <div className="flex flex-col items-center gap-8 w-full max-w-sm animate-fade-in-up">
          <div className="text-center">
            <h1 className="text-white text-4xl sm:text-5xl font-light tracking-tight mb-3">
              Set a PIN
            </h1>
            <p className="text-white/50 text-lg font-light">
              4 digits. Keeps your profile yours.
            </p>
          </div>

          <input
            ref={pinInputRef}
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            maxLength={4}
            placeholder="····"
            className="text-center text-5xl tracking-[0.6em] w-48 bg-transparent text-white outline-none border-b-2 border-white/30 focus:border-white/60 pb-2 transition-colors placeholder-white/20"
          />

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <button
            onClick={() => saveProfile(null)}
            disabled={saving}
            className="text-white/35 text-sm hover:text-white/60 transition-colors cursor-pointer disabled:opacity-30"
          >
            Skip — no PIN
          </button>
        </div>
      )}
    </main>
  )
}
