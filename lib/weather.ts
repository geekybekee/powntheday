export type WeatherData = {
  weatherCode: number
  cloudCover: number   // 0–100
  precipitation: number
  isDay: boolean
  description: string
}

export type WeatherOverlay = {
  color: string
  opacity: number
}

function describeWeatherCode(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rainy'
  if (code <= 77) return 'Snowy'
  if (code <= 82) return 'Showery'
  if (code <= 94) return 'Hail'
  return 'Stormy'
}

export function getWeatherOverlay(weather: WeatherData | null): WeatherOverlay | null {
  if (!weather) return null
  const { cloudCover, precipitation, weatherCode } = weather

  if (weatherCode >= 95) return { color: 'rgb(20,30,50)', opacity: 0.62 }
  if (precipitation > 0.5) return { color: 'rgb(40,60,85)', opacity: 0.45 }
  if (cloudCover > 85) return { color: 'rgb(75,85,100)', opacity: 0.52 }
  if (cloudCover > 60) return { color: 'rgb(100,112,130)', opacity: 0.33 }
  if (cloudCover > 25) return { color: 'rgb(130,142,158)', opacity: 0.16 }
  return null
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat.toFixed(4))
  url.searchParams.set('longitude', lng.toFixed(4))
  url.searchParams.set('current', 'weather_code,cloud_cover,precipitation,is_day')
  url.searchParams.set('timezone', 'auto')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Weather fetch failed')

  const data = await res.json()
  const c = data.current

  return {
    weatherCode: c.weather_code,
    cloudCover: c.cloud_cover,
    precipitation: c.precipitation,
    isDay: c.is_day === 1,
    description: describeWeatherCode(c.weather_code),
  }
}
