const RESERVED_HANDLES = new Set([
  'onboarding', 'api', 'admin', 'about', 'help', 'support', 'login',
  'logout', 'register', 'signup', 'signin', 'dashboard', 'settings',
  '_next', 'static', 'favicon', 'robots', 'sitemap', 'manifest', 'not-found',
  'stats',
])

export function sanitizeHandle(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/^[-_]+/, '')
    .slice(0, 30)
}

export function validateHandle(handle: string): string | null {
  if (handle.length < 2) return 'At least 2 characters'
  if (handle.length > 30) return '30 characters max'
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(handle)) return 'Lowercase letters, numbers, hyphens, and underscores only'
  if (RESERVED_HANDLES.has(handle)) return 'That handle is reserved — try something else'
  return null
}

export function validateName(name: string): string | null {
  const t = name.trim()
  if (t.length === 0) return 'Name is required'
  if (t.length > 50) return '50 characters max'
  return null
}

export function validateTaskLabel(label: string): string | null {
  const t = label.trim()
  if (t.length === 0) return 'Task is required'
  if (t.length > 200) return '200 characters max'
  return null
}
