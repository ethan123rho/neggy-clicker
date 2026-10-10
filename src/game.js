// Core game data and pure helpers. Tweak numbers here to rebalance the game.

export const NEGGY_IMAGE = '/neggy.png'
export const NEGGY_FALLBACK = '/neggy-placeholder.svg'

export const SAVE_KEY = 'neggy-clicker-save-v1'

export const BASE_CLICK = 1
export const REBIRTH_BASE_CLICKS = 100
export const COST_GROWTH = 1.15

// type "click" adds to Neggys per click, type "auto" adds to Neggys per second.
export const SHOP_ITEMS = [
  { id: 'candy', name: 'Candy Corn', emoji: '🍬', type: 'click', amount: 1, baseCost: 15 },
  { id: 'bat', name: 'Friendly Bat', emoji: '🦇', type: 'auto', amount: 1, baseCost: 25 },
  { id: 'ghost', name: 'Ghost Helper', emoji: '👻', type: 'auto', amount: 5, baseCost: 150 },
  { id: 'pumpkin', name: 'Magic Pumpkin', emoji: '🎃', type: 'click', amount: 5, baseCost: 400 },
  { id: 'cauldron', name: 'Bubbling Cauldron', emoji: '🧪', type: 'auto', amount: 25, baseCost: 1500 },
  { id: 'vampire', name: 'Vampire Butler', emoji: '🧛', type: 'auto', amount: 100, baseCost: 8000 },
  { id: 'moon', name: 'Haunted Moon', emoji: '🌕', type: 'click', amount: 50, baseCost: 25000 },
]

export const initialState = {
  neggys: 0,
  totalNeggys: 0,
  owned: {},
  rebirths: 0,
  rebirthClicks: 0,
}

export function itemCost(item, owned) {
  return Math.ceil(item.baseCost * Math.pow(COST_GROWTH, owned))
}

export function rebirthMultiplier(state) {
  return 1 + state.rebirths
}

export function perClick(state) {
  const bonus = SHOP_ITEMS.filter((i) => i.type === 'click').reduce(
    (sum, i) => sum + i.amount * (state.owned[i.id] || 0),
    0,
  )
  return (BASE_CLICK + bonus) * rebirthMultiplier(state)
}

export function perSecond(state) {
  return SHOP_ITEMS.filter((i) => i.type === 'auto').reduce(
    (sum, i) => sum + i.amount * (state.owned[i.id] || 0),
    0,
  )
}

export function rebirthGoal(state) {
  return REBIRTH_BASE_CLICKS * (state.rebirths + 1)
}

export function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return initialState
    return { ...initialState, ...JSON.parse(raw) }
  } catch {
    return initialState
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be unavailable (private mode); the game still works unsaved.
  }
}

export function formatNumber(n) {
  const v = Math.floor(n)
  if (v < 1000) return String(v)
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi']
  let i = -1
  let x = v
  while (x >= 1000 && i < units.length - 1) {
    x /= 1000
    i++
  }
  return `${x.toFixed(x < 10 ? 2 : x < 100 ? 1 : 0)}${units[i]}`
}
