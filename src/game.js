// Core game data and pure helpers. Tweak numbers here to rebalance the game.

export const NEGGY_IMAGE = '/neggy.png'
export const NEGGY_FALLBACK = '/neggy-placeholder.svg'

export const SAVE_KEY = 'neggy-clicker-save-v1'

export const BASE_CLICK = 2
export const REBIRTH_BASE_CLICKS = 100
export const COST_GROWTH = 1.15

// type "click" adds to Neggys per click, "auto" adds to Neggys per second,
// and "multiplier" doubles every click once per purchase (stacking).
// baseCost is the price of the first purchase; each purchase raises it by COST_GROWTH.
export const SHOP_ITEMS = [
  { id: 'nathaniel', name: 'Nathaniel', emoji: '🧑', image: '/nathaniel.png', type: 'auto', amount: 1, baseCost: 100, desc: 'Produces 1 Neggy / sec' },
  { id: 'candy', name: 'Neggy Candy Corn', emoji: '🍬', type: 'click', amount: 5, baseCost: 150, desc: '+5 Neggy every click' },
  { id: 'farm', name: 'Neggy Farm', emoji: '🌽', type: 'auto', amount: 5, baseCost: 500, desc: 'Produces 5 Neggy / sec' },
  { id: 'ghost', name: 'Neggy Ghost', emoji: '👻', type: 'click', amount: 50, baseCost: 1200, desc: 'Boo! +50 Neggy every click' },
  { id: 'factory', name: 'Neggy Factory', emoji: '🏭', type: 'click', amount: 100, baseCost: 2000, desc: '+100 Neggy every click' },
  { id: 'brew', name: 'Neggy Brew', emoji: '🧪', type: 'auto', amount: 80, baseCost: 9000, desc: 'Magical auto-clicking potion. +80 Neggy / sec' },
  { id: 'mine', name: 'Neggy Mine', emoji: '⛏️', type: 'auto', amount: 50, baseCost: 20000, desc: 'Produces 50 Neggy / sec' },
  { id: 'temple', name: 'Neggy Temple', emoji: '🏛️', type: 'auto', amount: 200, baseCost: 100000, desc: 'Produces 200 Neggy / sec' },
  { id: 'skeleton', name: 'Neggy Skeleton Crew', emoji: '💀', type: 'auto', amount: 600, baseCost: 110000, desc: 'A boney brigade of clickers. +600 Neggy / sec' },
  { id: 'golden', name: 'Golden Neggy', emoji: '🌟', type: 'multiplier', amount: 2, baseCost: 120000, desc: 'Doubles ALL clicks (stacks each purchase)' },
  { id: 'portal', name: 'Neggy Portal', emoji: '🌀', type: 'auto', amount: 1000, baseCost: 600000, desc: 'Produces 1,000 Neggy / sec' },
  { id: 'pumpkin', name: 'Neggy Pumpkin Patch', emoji: '🎃', type: 'auto', amount: 3000, baseCost: 1000000, desc: 'Endless haunted harvest. +3,000 Neggy / sec' },
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
  const golden = SHOP_ITEMS.filter((i) => i.type === 'multiplier').reduce(
    (m, i) => m * Math.pow(i.amount, state.owned[i.id] || 0),
    1,
  )
  return (BASE_CLICK + bonus) * golden * rebirthMultiplier(state)
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
  return `${parseFloat(x.toFixed(x < 10 ? 2 : x < 100 ? 1 : 0))}${units[i]}`
}
