import { useEffect, useRef, useState } from 'react'
import { initialState, saveState } from './game.js'
import { cloudEnabled, loadCloudSave, supabase, writeCloudSave } from './cloud.js'

const CLOUD_SAVE_MS = 15000

// Keeps the signed-in player's progress in sync with their cloud save.
// On sign-in: an existing cloud save replaces local progress; a brand-new
// account adopts whatever the player earned as a guest.
// On sign-out: local progress resets so the next player starts fresh.
export function useCloudSave(state, setState) {
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | saved | saving | error
  const stateRef = useRef(state)
  stateRef.current = state
  const lastUploaded = useRef(null)
  const userId = session?.user?.id

  useEffect(() => {
    if (!cloudEnabled) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  // Load (or create) the cloud save whenever a different player signs in.
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      try {
        const cloud = await loadCloudSave(userId)
        if (cancelled) return
        if (cloud) {
          const next = { ...initialState, ...cloud }
          setState(next)
          saveState(next)
          lastUploaded.current = JSON.stringify(next)
        } else {
          await writeCloudSave(userId, stateRef.current)
          lastUploaded.current = JSON.stringify(stateRef.current)
        }
        if (!cancelled) setStatus('saved')
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, setState])

  // Periodic upload while signed in, plus one when the tab is hidden.
  useEffect(() => {
    if (!userId) return
    const upload = async () => {
      const snapshot = JSON.stringify(stateRef.current)
      if (lastUploaded.current === null || snapshot === lastUploaded.current) return
      setStatus('saving')
      try {
        await writeCloudSave(userId, stateRef.current)
        lastUploaded.current = snapshot
        setStatus('saved')
      } catch {
        setStatus('error')
      }
    }
    const id = setInterval(upload, CLOUD_SAVE_MS)
    const onHide = () => document.visibilityState === 'hidden' && upload()
    document.addEventListener('visibilitychange', onHide)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [userId])

  const handleSignedOut = () => {
    lastUploaded.current = null
    setStatus('idle')
    setState(initialState)
    saveState(initialState)
  }

  // Upload the latest progress before signing out so nothing is lost.
  const flush = async () => {
    if (userId && lastUploaded.current !== null) {
      await writeCloudSave(userId, stateRef.current).catch(() => {})
    }
  }

  return { session, status, flush, handleSignedOut }
}
