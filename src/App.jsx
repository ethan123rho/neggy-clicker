import { useCallback, useEffect, useRef, useState } from 'react'
import {
  NEGGY_FALLBACK,
  NEGGY_IMAGE,
  BULK_AMOUNTS,
  SHOP_ITEMS,
  bulkCost,
  formatNumber,
  initialState,
  itemCost,
  loadState,
  perClick,
  perSecond,
  rebirthGoal,
  rebirthMultiplier,
  saveState,
} from './game.js'

const TICK_MS = 100

const DECORATIONS = [
  { emoji: '🍭', top: '8%', left: '62%', delay: '0s' },
  { emoji: '👻', top: '26%', left: '86%', delay: '1.2s' },
  { emoji: '🧛', top: '42%', left: '30%', delay: '2.4s' },
  { emoji: '🦇', top: '55%', left: '9%', delay: '0.6s' },
  { emoji: '🎃', top: '70%', left: '80%', delay: '3s' },
  { emoji: '🕸️', top: '88%', left: '14%', delay: '1.8s' },
]

export default function App() {
  const [state, setState] = useState(loadState)
  const stateRef = useRef(state)
  stateRef.current = state

  // Passive income.
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => {
        const gain = (perSecond(s) * TICK_MS) / 1000
        if (gain === 0) return s
        return { ...s, neggys: s.neggys + gain, totalNeggys: s.totalNeggys + gain }
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  // Autosave every couple of seconds and when the tab closes.
  useEffect(() => {
    const id = setInterval(() => saveState(stateRef.current), 2000)
    const onUnload = () => saveState(stateRef.current)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      clearInterval(id)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [])

  const handleClick = useCallback(() => {
    setState((s) => {
      const gain = perClick(s)
      return {
        ...s,
        neggys: s.neggys + gain,
        totalNeggys: s.totalNeggys + gain,
        rebirthClicks: s.rebirthClicks + 1,
      }
    })
  }, [])

  const buy = useCallback((item, count = 1) => {
    setState((s) => {
      const owned = s.owned[item.id] || 0
      const cost = bulkCost(item, owned, count)
      if (s.neggys < cost) return s
      return { ...s, neggys: s.neggys - cost, owned: { ...s.owned, [item.id]: owned + count } }
    })
  }, [])

  const rebirth = useCallback(() => {
    setState((s) => {
      if (s.rebirthClicks < rebirthGoal(s)) return s
      return { ...initialState, totalNeggys: s.totalNeggys, rebirths: s.rebirths + 1 }
    })
  }, [])

  // Two-step reset: the first click arms it, the second erases the save.
  const [confirmReset, setConfirmReset] = useState(false)
  const resetAll = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 4000)
      return
    }
    setConfirmReset(false)
    setState(initialState)
    saveState(initialState)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100">
      {DECORATIONS.map((d) => (
        <span
          key={d.emoji}
          aria-hidden
          className="pointer-events-none absolute animate-float select-none text-3xl opacity-70"
          style={{ top: d.top, left: d.left, animationDelay: d.delay }}
        >
          {d.emoji}
        </span>
      ))}

      <p
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[22rem] -translate-x-1/2 -rotate-12 select-none whitespace-nowrap text-center text-7xl font-black leading-none text-orange-400/30 sm:text-9xl"
      >
        HAPPY
        <br />
        HALLOWEEN
      </p>

      <main className="relative mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-amber-950">Neggy Clicker</h1>
          <Counter state={state} />
          <Neggy perClick={perClick(state)} onClick={handleClick} />
          <RebirthMachine state={state} onRebirth={rebirth} />
          <h2 className="text-center text-3xl font-extrabold text-orange-600">🎃 Happy Halloween 🎃</h2>
        </div>
        <Shop state={state} onBuy={buy} />
        <button
          onClick={resetAll}
          className="mx-auto text-xs text-stone-400 underline hover:text-stone-600 lg:col-span-2"
        >
          {confirmReset ? 'Click again to erase everything, including rebirths' : 'Reset save'}
        </button>
      </main>
    </div>
  )
}

function Counter({ state }) {
  // The bar tracks progress toward the cheapest item you can't afford yet.
  const costs = SHOP_ITEMS.map((i) => itemCost(i, state.owned[i.id] || 0))
  const next = Math.min(...costs.filter((c) => c > state.neggys), Infinity)
  const pct = next === Infinity ? 100 : Math.min(100, (state.neggys / next) * 100)

  return (
    <section className="rounded-2xl border border-amber-200 bg-white/80 p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <p>
          <span className="text-4xl font-bold">{formatNumber(state.neggys)}</span>{' '}
          <span className="text-xl text-amber-700">Neggy</span>
        </p>
        <p className="text-sm font-medium text-amber-600">{formatNumber(perSecond(state))} per second</p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-amber-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  )
}

function Neggy({ perClick, onClick }) {
  const [pops, setPops] = useState([])
  const [pressed, setPressed] = useState(false)

  const click = (e) => {
    onClick()
    const rect = e.currentTarget.getBoundingClientRect()
    const id = Math.random()
    const x = (e.clientX || rect.left + rect.width / 2) - rect.left
    const y = (e.clientY || rect.top + rect.height / 2) - rect.top
    setPops((p) => [...p, { id, x, y }])
    setTimeout(() => setPops((p) => p.filter((pop) => pop.id !== id)), 900)
    setPressed(true)
    setTimeout(() => setPressed(false), 90)
  }

  return (
    <section className="flex flex-col items-center gap-3">
      <button
        onClick={click}
        aria-label="Click Neggy"
        className={`relative h-64 w-64 select-none rounded-full border-4 border-amber-300 bg-black shadow-[0_0_40px_rgba(251,191,36,0.45)] transition-transform duration-75 sm:h-72 sm:w-72 ${
          pressed ? 'scale-95' : 'hover:scale-105'
        }`}
      >
        <span className="block h-full w-full overflow-hidden rounded-full">
          <img
            src={NEGGY_IMAGE}
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = NEGGY_FALLBACK
            }}
            alt="Neggy"
            draggable={false}
            className="h-full w-full origin-[50%_25%] scale-[1.7] object-cover"
          />
        </span>
        {pops.map((p) => (
          <span
            key={p.id}
            className="pointer-events-none absolute animate-rise text-2xl font-extrabold text-amber-400 drop-shadow"
            style={{ left: p.x, top: p.y }}
          >
            +{formatNumber(perClick)}
          </span>
        ))}
      </button>
      <p className="text-amber-700">+{formatNumber(perClick)} per click</p>
    </section>
  )
}

function RebirthMachine({ state, onRebirth }) {
  const goal = rebirthGoal(state)
  const clicks = Math.min(state.rebirthClicks, goal)
  const ready = state.rebirthClicks >= goal

  return (
    <section className="rounded-2xl border border-purple-200 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold uppercase tracking-wide text-purple-700">
          <span>🌀</span> Rebirth Machine
        </h2>
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-sm font-semibold text-purple-700">
          ×{rebirthMultiplier(state)} clicks
        </span>
      </div>
      <p className="mt-2 text-sm text-stone-600">
        Rebirth to restart your Neggys and upgrades — you keep a permanent click multiplier.
      </p>
      <div className="mt-3 flex justify-between text-sm text-stone-700">
        <span>
          {clicks} / {goal} clicks
        </span>
        <span>{ready ? 'Ready!' : `${goal - clicks} to go`}</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-purple-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 transition-[width] duration-200"
          style={{ width: `${(clicks / goal) * 100}%` }}
        />
      </div>
      <button
        onClick={onRebirth}
        disabled={!ready}
        className="mt-4 w-full rounded-xl py-3 font-semibold transition enabled:bg-gradient-to-r enabled:from-fuchsia-500 enabled:to-purple-600 enabled:text-white enabled:hover:brightness-110 disabled:bg-stone-100 disabled:text-stone-400"
      >
        {ready ? `Rebirth for ×${rebirthMultiplier(state) + 1} clicks` : `Need ${goal} clicks`}
      </button>
    </section>
  )
}

function Shop({ state, onBuy }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-white/80 p-5 shadow-sm">
      <h2 className="mb-3 font-bold uppercase tracking-wide text-amber-800">Shop</h2>
      <ul className="flex flex-col gap-2">
        {SHOP_ITEMS.map((item) => {
          const owned = state.owned[item.id] || 0
          const cost = itemCost(item, owned)
          const affordable = state.neggys >= cost
          return (
            <li
              key={item.id}
              className="rounded-xl border border-amber-100 bg-amber-50/60 transition hover:border-amber-300"
            >
              <button
                onClick={() => onBuy(item)}
                disabled={!affordable}
                className="flex w-full items-center gap-3 rounded-t-xl p-3 text-left transition enabled:hover:bg-amber-100 disabled:opacity-50"
              >
                <ItemIcon item={item} />
                <span className="flex-1">
                  <span className="block font-semibold">{item.name}</span>
                  <span className="block text-sm text-stone-600">{item.desc}</span>
                </span>
                {owned > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    ×{owned}
                  </span>
                )}
                <span className="w-16 text-right">
                  <span className="block font-bold text-amber-700">{formatNumber(cost)}</span>
                  <span className="block text-[10px] uppercase tracking-wide text-stone-500">Neggy</span>
                </span>
              </button>
              <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                {BULK_AMOUNTS.map((n) => {
                  const total = bulkCost(item, owned, n)
                  return (
                    <button
                      key={n}
                      onClick={() => onBuy(item, n)}
                      disabled={state.neggys < total}
                      title={`Buy ${n} for ${formatNumber(total)} Neggy`}
                      className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-xs transition enabled:hover:border-amber-400 enabled:hover:bg-amber-100 disabled:opacity-40"
                    >
                      <span className="font-bold text-amber-800">+{n}</span>{' '}
                      <span className="text-stone-500">{formatNumber(total)}</span>
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ItemIcon({ item }) {
  const [broken, setBroken] = useState(false)
  if (item.image && !broken) {
    return (
      <img
        src={item.image}
        alt=""
        onError={() => setBroken(true)}
        className="h-10 w-10 rounded-full object-cover"
      />
    )
  }
  return <span className="w-10 text-center text-3xl">{item.emoji}</span>
}
