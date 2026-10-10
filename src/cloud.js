// Accounts, cloud saves and the leaderboard, backed by Supabase.
// When the Supabase env vars are missing, `cloudEnabled` is false and the game
// runs with browser-only saves.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const cloudEnabled = Boolean(supabase)

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/

// Players sign in with a username, so each one maps to a placeholder email
// that Supabase uses internally. No email is ever sent to it.
function usernameToEmail(username) {
  return `${username}@players.neggy-clicker.app`
}

export function normalizeUsername(username) {
  return username.trim().toLowerCase()
}

export async function signUp(username, password) {
  const name = normalizeUsername(username)
  if (!USERNAME_PATTERN.test(name)) {
    throw new Error('Usernames are 3–20 letters, numbers or underscores.')
  }
  const { data, error } = await supabase.auth.signUp({
    email: usernameToEmail(name),
    password,
    options: { data: { username: name } },
  })
  if (error) throw new Error(friendlyError(error))
  if (!data.session) {
    throw new Error('Account created, but email confirmation is on in Supabase. Turn it off to let players sign in.')
  }
  return data.session
}

export async function signIn(username, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(normalizeUsername(username)),
    password,
  })
  if (error) throw new Error(friendlyError(error))
  return data.session
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function usernameOf(session) {
  return session?.user?.user_metadata?.username ?? 'player'
}

export async function loadCloudSave(userId) {
  const { data, error } = await supabase.from('saves').select('data').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data?.data ?? null
}

export async function writeCloudSave(userId, state) {
  const { error } = await supabase.from('saves').upsert({
    user_id: userId,
    data: state,
    total_neggys: Math.floor(state.totalNeggys),
    rebirths: state.rebirths,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function fetchLeaderboard(limit = 10) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('username, total_neggys, rebirths')
    .order('total_neggys', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

function friendlyError(error) {
  const msg = error.message || ''
  if (/already registered|already exists/i.test(msg)) return 'That username is taken.'
  if (/invalid login credentials/i.test(msg)) return 'Wrong username or password.'
  if (/password/i.test(msg)) return msg
  return msg || 'Something went wrong. Try again.'
}
