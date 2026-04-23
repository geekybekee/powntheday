'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import { getSkyGradient } from '@/lib/sky'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Hey, night owl.'
  if (hour < 12) return 'Good morning.'
  if (hour < 17) return 'Good afternoon.'
  if (hour < 21) return 'Good evening.'
  return 'Hey, night owl.'
}

export default function ProfileSelector() {
  const router = useRouter()
  const [handle, setHandle] = useState('')
  const [pinPrompt, setPinPrompt] = useState<Profile | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [checking, setChecking] = useState(false)
  const pinInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (pinPrompt) pinInputRef.current?.focus()
  }, [pinPrompt])

  async function handleGo() {
    const h = handle.trim()
    if (!h) return
    setNotFound(false)
    setChecking(true)

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('handle', h)
      .maybeSingle()

    setChecking(false)

    if (!profile) {
      setNotFound(true)
      return
    }

    if (profile.pin) {
      setPinPrompt(profile)
      setPinInput('')
      setPinError(false)
    } else {
      router.push(`/${profile.handle}`)
    }
  }

  function handlePinInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    setPinInput(digits)
    setPinError(false)

    if (digits.length === 4) {
      setTimeout(() => {
        if (digits === pinPrompt?.pin) {
          router.push(`/${pinPrompt.handle}`)
        } else {
          setPinError(true)
          setPinInput('')
        }
      }, 200)
    }
  }

  function dismissPin() {
    setPinPrompt(null)
    setPinInput('')
    setPinError(false)
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-8"
      style={{ background: getSkyGradient(new Date().getHours()) }}
    >
      <h1 className="text-white text-5xl sm:text-7xl font-light tracking-tight mb-3">
        {getGreeting()}
      </h1>
      <p className="text-white/50 text-xl sm:text-2xl mb-12 font-light">
        Who&apos;s there?
      </p>

      <div className="w-full max-w-sm flex flex-col items-center gap-3">
        <input
          type="text"
          value={handle}
          onChange={(e) => {
            setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30))
            setNotFound(false)
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleGo() }}
          placeholder="your-handle"
          autoFocus
          maxLength={30}
          className="w-full bg-white/10 border border-white/25 rounded-2xl px-6 py-4 text-white text-xl placeholder-white/30 outline-none focus:border-white/50 focus:bg-white/15 transition-all text-center backdrop-blur-md font-mono"
        />
        {notFound && (
          <p className="text-white/40 text-sm">Handle not found.</p>
        )}
        <button
          onClick={handleGo}
          disabled={!handle.trim() || checking}
          className="px-10 py-3 rounded-2xl bg-white/15 border border-white/25 text-white text-lg font-medium hover:bg-white/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          {checking ? '…' : 'Go'}
        </button>
      </div>

      <button
        onClick={() => router.push('/onboarding')}
        className="mt-12 text-white/35 text-sm hover:text-white/60 transition-colors cursor-pointer bg-black/20 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/15 hover:bg-black/30"
      >
        + New profile
      </button>

      {pinPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) dismissPin() }}
        >
          <div className="flex flex-col items-center gap-7 p-10 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md w-80">
            <p className="text-white/70 text-lg font-light text-center">
              PIN for <span className="text-white font-medium">{pinPrompt.name}</span>
            </p>

            <input
              ref={pinInputRef}
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => handlePinInput(e.target.value)}
              maxLength={4}
              placeholder="····"
              className={`text-center text-5xl tracking-[0.6em] w-40 bg-transparent text-white outline-none border-b-2 pb-2 transition-colors placeholder-white/20
                ${pinError ? 'border-red-400/60' : 'border-white/30 focus:border-white/60'}`}
            />

            {pinError && (
              <p className="text-red-300/80 text-sm -mt-3">Incorrect PIN</p>
            )}

            <button
              onClick={dismissPin}
              className="text-white/30 text-sm hover:text-white/55 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
