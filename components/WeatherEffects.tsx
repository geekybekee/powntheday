'use client'

import { useMemo } from 'react'
import type { WeatherData } from '@/lib/weather'

type Props = {
  weather: WeatherData | null
  isNight: boolean
}

function seeded(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export function WeatherEffects({ weather, isNight }: Props) {
  const code = weather?.weatherCode ?? -1
  const cloudCover = weather?.cloudCover ?? 0

  const showStars = isNight && cloudCover < 50
  const isRain = code >= 51 && code <= 82 && !(code >= 71 && code <= 77) && code !== 85 && code !== 86
  const isSnow = (code >= 71 && code <= 77) || code === 85 || code === 86

  const stars = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    x: seeded(i * 3 + 1) * 100,
    y: seeded(i * 3 + 2) * 72,
    size: seeded(i * 3 + 3) < 0.75 ? 1 : 2,
    duration: 2 + seeded(i + 100) * 3,
    delay: seeded(i + 200) * 5,
  })), [])

  const raindrops = useMemo(() => Array.from({ length: 65 }, (_, i) => ({
    x: seeded(i * 2 + 500) * 110 - 5,
    duration: 0.7 + seeded(i + 600) * 0.35,
    delay: seeded(i + 700) * 2,
    height: 11 + seeded(i + 800) * 7,
    opacity: 0.3 + seeded(i + 900) * 0.25,
  })), [])

  const snowflakes = useMemo(() => Array.from({ length: 38 }, (_, i) => ({
    x: seeded(i * 2 + 1000) * 100,
    size: 2 + seeded(i + 1100) * 3,
    duration: 5 + seeded(i + 1200) * 5,
    delay: seeded(i + 1300) * 6,
    drift: (seeded(i + 1400) - 0.5) * 70,
    opacity: 0.55 + seeded(i + 1500) * 0.35,
  })), [])


  if (!showStars && !isRain && !isSnow) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[5]">
      {showStars && stars.map((star, i) => (
        <div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animation: `twinkle ${star.duration}s ${star.delay}s ease-in-out infinite`,
          }}
        />
      ))}

      {isRain && raindrops.map((drop, i) => (
        <div
          key={`rain-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${drop.x}%`,
            top: '-20px',
            width: 1,
            height: drop.height,
            background: 'rgba(180,210,255,0.7)',
            opacity: drop.opacity,
            animation: `rain-fall ${drop.duration}s ${drop.delay}s linear infinite`,
          }}
        />
      ))}

      {isSnow && snowflakes.map((flake, i) => (
        <div
          key={`snow-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            left: `${flake.x}%`,
            top: '-10px',
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            ['--snow-drift' as string]: `${flake.drift}px`,
            animation: `snow-drift ${flake.duration}s ${flake.delay}s ease-in-out infinite`,
          }}
        />
      ))}

    </div>
  )
}
