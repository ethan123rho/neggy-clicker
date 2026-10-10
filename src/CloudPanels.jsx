import { useEffect, useState } from 'react'
import { fetchLeaderboard, signIn, signOut, signUp, usernameOf } from './cloud.js'
import { formatNumber } from './game.js'

const STATUS_TEXT = {
  idle: '',
  loading: 'Loading your save…',
  saving: 'Saving…',
  saved: 'Progress saved to your account',
  error: "Couldn't reach the server. Progress is still saved in this browser.",
}

export function AccountPanel({ session, status, flush, onSignedOut }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const run = (action) => async (e) => {
    e?.preventDefault()
    setError('')
    setBusy(true)
    try {
      await action(username, password)
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (session) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-white/80 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p>
            Signed in as <span className="font-bold text-amber-800">{usernameOf(session)}</span>
          </p>
          <button
            onClick={async () => {
              setBusy(true)
              await flush()
              await signOut()
              onSignedOut()
              setBusy(false)
            }}
            disabled={busy}
            className="rounded-lg border border-amber-200 px-3 py-1 text-sm hover:bg-amber-100 disabled:opacity-50"
          >
            Sign out
          </button>
        </div>
        {STATUS_TEXT[status] && <p className="mt-1 text-xs text-stone-500">{STATUS_TEXT[status]}</p>}
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-white/80 p-5 shadow-sm">
      <h2 className="font-bold uppercase tracking-wide text-amber-800">Save your progress</h2>
      <p className="mt-1 text-sm text-stone-600">
        Sign in to keep your Neggys on any device and get on the leaderboard.
      </p>
      <form onSubmit={run(signIn)} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
          className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
        />
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
        />
      </form>
      <div className="mt-2 flex gap-2">
        <button
          onClick={run(signIn)}
          disabled={busy || !username || !password}
          className="flex-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 py-2 text-sm font-semibold text-white enabled:hover:brightness-110 disabled:opacity-50"
        >
          Sign in
        </button>
        <button
          onClick={run(signUp)}
          disabled={busy || !username || password.length < 6}
          title="Passwords need at least 6 characters"
          className="flex-1 rounded-lg border border-amber-300 py-2 text-sm font-semibold text-amber-800 enabled:hover:bg-amber-100 disabled:opacity-50"
        >
          Create account
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  )
}

export function Leaderboard({ session }) {
  const [rows, setRows] = useState(null)
  const [failed, setFailed] = useState(false)
  const me = session ? usernameOf(session) : null

  useEffect(() => {
    const load = () =>
      fetchLeaderboard()
        .then((data) => {
          setRows(data)
          setFailed(false)
        })
        .catch(() => setFailed(true))
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="rounded-2xl border border-amber-200 bg-white/80 p-5 shadow-sm">
      <h2 className="mb-3 font-bold uppercase tracking-wide text-amber-800">🏆 Leaderboard</h2>
      {failed && <p className="text-sm text-stone-500">Couldn't load the leaderboard.</p>}
      {!failed && rows === null && <p className="text-sm text-stone-500">Loading…</p>}
      {rows?.length === 0 && <p className="text-sm text-stone-500">No one yet. Sign in to be first!</p>}
      {rows?.length > 0 && (
        <ol className="flex flex-col gap-1">
          {rows.map((r, i) => (
            <li
              key={r.username}
              className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm tabular-nums ${
                r.username === me ? 'bg-amber-100 font-semibold' : ''
              }`}
            >
              <span className="w-6 text-stone-500">{i + 1}</span>
              <span className="flex-1 truncate">{r.username}</span>
              {r.rebirths > 0 && <span className="text-xs text-purple-600">🌀{r.rebirths}</span>}
              <span className="font-bold text-amber-700">{formatNumber(r.total_neggys)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
