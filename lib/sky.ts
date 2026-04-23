import SunCalc from 'suncalc'

// Precise sun-position gradient — uses real lat/lng + SunCalc
export function getSkyGradientFromCoords(date: Date, lat: number, lng: number): string {
  const pos = SunCalc.getPosition(date, lat, lng)
  const altDeg = pos.altitude * (180 / Math.PI)
  const times = SunCalc.getTimes(date, lat, lng)
  const rising = date < times.solarNoon

  return getSkyGradientFromAltitude(altDeg, rising)
}

export function getSkyGradientFromAltitude(altDeg: number, rising: boolean): string {
  // Night
  if (altDeg < -18) {
    return 'linear-gradient(to bottom, #000509 0%, #010b1a 40%, #030f22 75%, #051427 100%)'
  }
  // Astronomical twilight
  if (altDeg < -12) {
    return 'linear-gradient(to bottom, #010b1a 0%, #0d1e38 45%, #1a2d4a 80%, #1e304e 100%)'
  }
  // Nautical twilight
  if (altDeg < -6) {
    return 'linear-gradient(to bottom, #0d1e38 0%, #1a2d4a 35%, #2a2648 65%, #3a2840 100%)'
  }
  // Civil twilight — pre-dawn vs post-dusk
  if (altDeg < 0) {
    if (rising) {
      return 'linear-gradient(to bottom, #0d1e38 0%, #1a2d50 30%, #5a3020 60%, #a05838 85%, #c07040 100%)'
    } else {
      return 'linear-gradient(to bottom, #0d1e38 0%, #1a2a4a 30%, #3a2858 60%, #6a3020 85%, #7a3828 100%)'
    }
  }
  // Sunrise / sunset band
  if (altDeg < 8) {
    if (rising) {
      return 'linear-gradient(to bottom, #0d1e38 0%, #1a3d6a 25%, #b86030 55%, #e89848 78%, #f0c060 100%)'
    } else {
      return 'linear-gradient(to bottom, #0d1838 0%, #1a3050 25%, #b85a28 55%, #e09040 78%, #eba050 100%)'
    }
  }
  // Low morning / late afternoon
  if (altDeg < 20) {
    if (rising) {
      return 'linear-gradient(to bottom, #1a3a6a 0%, #2d6aaa 35%, #5aa0cc 68%, #88c4e4 100%)'
    } else {
      return 'linear-gradient(to bottom, #1a3a6a 0%, #2d68aa 35%, #5eaad0 68%, #90c8e0 100%)'
    }
  }
  // Mid-sky
  if (altDeg < 40) {
    return 'linear-gradient(to bottom, #1a5a9a 0%, #2d7ac8 38%, #4a9ccc 68%, #78bce0 100%)'
  }
  // High midday
  return 'linear-gradient(to bottom, #1560aa 0%, #2878c0 35%, #4a9cc8 65%, #72b8d8 100%)'
}

// Hour-based fallback — used when no geolocation
export function getSkyGradient(hour: number): string {
  if (hour < 5) return 'linear-gradient(to bottom, #010b1a 0%, #0a1628 50%, #0d1f3c 100%)'
  if (hour < 7) return 'linear-gradient(to bottom, #0a1628 0%, #1e3a5f 40%, #7a4a2a 70%, #e8925a 100%)'
  if (hour < 10) return 'linear-gradient(to bottom, #1a3a5f 0%, #2d6a8f 40%, #e8b17c 75%, #f5d5a0 100%)'
  if (hour < 15) return 'linear-gradient(to bottom, #1a6fa8 0%, #2d8fc4 40%, #5aaec8 70%, #80c4dc 100%)'
  if (hour < 18) return 'linear-gradient(to bottom, #1a5a8a 0%, #2d7aaa 40%, #c47a30 70%, #e8a060 100%)'
  if (hour < 20) return 'linear-gradient(to bottom, #0d1f3c 0%, #3a2a5a 30%, #8a3a20 65%, #c05a20 100%)'
  return 'linear-gradient(to bottom, #010b1a 0%, #0a1225 40%, #0d1f3c 100%)'
}

export function getSunAltitude(date: Date, lat: number, lng: number): number {
  return SunCalc.getPosition(date, lat, lng).altitude * (180 / Math.PI)
}

export function getGreeting(name: string, hour: number): string {
  if (hour < 5) return `Still up, ${name}?`
  if (hour < 12) return `Good morning, ${name}.`
  if (hour < 17) return `Good afternoon, ${name}.`
  if (hour < 21) return `Good evening, ${name}.`
  return `Hey, ${name}.`
}
