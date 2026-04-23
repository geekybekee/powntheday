export type PersonalityType = 'steady' | 'athlete' | 'maker' | 'nurturer'

export const PERSONALITY_TYPES: Record<PersonalityType, { label: string; description: string }> = {
  steady: {
    label: 'The Steady One',
    description: 'Low-key, intentional, wellness-minded.',
  },
  athlete: {
    label: 'The Athlete',
    description: 'Physical, structured, performance-driven.',
  },
  maker: {
    label: 'The Maker',
    description: 'Builder, tinkerer, project-focused.',
  },
  nurturer: {
    label: 'The Nurturer',
    description: 'Connection-oriented, community, family.',
  },
}

export type StarterTask = {
  label: string
  days: boolean[] // Sun–Sat, all true by default
  importance: 'normal' | 'low'
}

const allDays: boolean[] = [true, true, true, true, true, true, true]

export const STARTER_TASKS: Record<PersonalityType, StarterTask[]> = {
  steady: [
    { label: 'Make my bed', days: allDays, importance: 'normal' },
    { label: 'Drink a full glass of water', days: allDays, importance: 'normal' },
    { label: 'Journal for 10 minutes', days: allDays, importance: 'normal' },
    { label: 'Meditate', days: allDays, importance: 'normal' },
    { label: 'Eat a real breakfast', days: allDays, importance: 'normal' },
    { label: 'Read something (not my phone)', days: allDays, importance: 'normal' },
  ],
  athlete: [
    { label: 'Take my vitals', days: allDays, importance: 'normal' },
    { label: 'Hydrate (32oz before noon)', days: allDays, importance: 'normal' },
    { label: 'Work out', days: allDays, importance: 'normal' },
    { label: 'Stretch', days: allDays, importance: 'normal' },
    { label: 'Cold shower', days: allDays, importance: 'normal' },
    { label: 'Vitamins and supplements', days: allDays, importance: 'normal' },
  ],
  maker: [
    { label: 'Morning vitamins', days: allDays, importance: 'normal' },
    { label: 'Hydrate', days: allDays, importance: 'normal' },
    { label: 'Check my project list', days: allDays, importance: 'normal' },
    { label: 'Spend time in the shop or studio', days: allDays, importance: 'normal' },
    { label: 'Cold shower', days: allDays, importance: 'normal' },
    { label: 'Clear my workspace', days: allDays, importance: 'normal' },
  ],
  nurturer: [
    { label: 'Drink water', days: allDays, importance: 'normal' },
    { label: 'Get outside', days: allDays, importance: 'normal' },
    { label: 'Journal', days: allDays, importance: 'normal' },
    { label: 'Check in with someone', days: allDays, importance: 'normal' },
    { label: 'Take my vitamins', days: allDays, importance: 'normal' },
    { label: 'Do one thing for someone else', days: allDays, importance: 'normal' },
  ],
}
