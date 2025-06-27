/**
 * SentientZone Simulation Engine – 30 Day Virtual Clinic Model
 * Now supports stochastic occupancy, weather, and HVAC efficiency.
 */

declare const require: any
declare const module: any

export type Room = 'TherapyA' | 'TherapyB' | 'Waiting' | 'Admin'

export type RoomState = {
  temp: number
  occupied: boolean
  targetTemp: number
  comfortViolations: number
  runtimeMinutes: number
}

export type SimulationState = {
  minute: number
  rooms: Record<Room, RoomState>
  externalTemp: number
  hvacOn: boolean
  energyUsed_kWh: number
}

export interface SimulationConfig {
  occupancyProb?: Record<Room, number[]> // 24 length array per room
  baseExternalTemp?: number
  weatherProfile?: 'hot' | 'cold' | 'mixed'
}

export interface SimulateOptions {
  isSentient: boolean
  seed?: string
  config?: SimulationConfig
  trace?: boolean
}

export interface SimulationResult {
  energyUsed_kWh: number
  comfortViolations: number
  runtimeMinutes: number
  seed: string
  trace?: SimulationState[]
}

const SIM_DAYS = 30
const MINUTES_PER_DAY = 24 * 60
const TOTAL_MINUTES = SIM_DAYS * MINUTES_PER_DAY

const ROOMS: Room[] = ['TherapyA', 'TherapyB', 'Waiting', 'Admin']

const COMFORT_RANGE = { min: 68, max: 74 }
const HVAC_POWER_KW = 4.29 // Typical for 5-ton unit
const TEMP_GAIN_PER_OCCUPANT = 0.2 // °F/min
const TEMP_LOSS_UNOCCUPIED = 0.1 // °F/min

function hashSeed(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i)
  return h >>> 0
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createRNG(seed: string) {
  return mulberry32(hashSeed(seed))
}

const DEFAULT_OCC_PROB: Record<Room, number[]> = {
  TherapyA: Array.from({ length: 24 }, (_, h) => (h >= 9 && h < 17 ? 0.6 : 0.1)),
  TherapyB: Array.from({ length: 24 }, (_, h) => (h >= 9 && h < 17 ? 0.6 : 0.1)),
  Waiting: Array.from({ length: 24 }, (_, h) => (h >= 9 && h < 17 ? 0.8 : 0.2)),
  Admin: Array.from({ length: 24 }, (_, h) => (h >= 8 && h < 18 ? 0.9 : 0.1)),
}

export function simulate({
  isSentient,
  seed = 'seed',
  config = {},
  trace = false,
}: SimulateOptions): SimulationResult {
  const rand = createRNG(seed)
  const log: SimulationState[] = []

  const occupancy = { ...DEFAULT_OCC_PROB, ...config.occupancyProb }
  const weatherProfile = config.weatherProfile || 'hot'
  const baseExternal =
    config.baseExternalTemp ?? (weatherProfile === 'cold' ? 50 : weatherProfile === 'mixed' ? 75 : 90)
  const hvacEfficiency = 1 + (rand() * 0.2 - 0.1) // ±10%
  const hvacPower = HVAC_POWER_KW * hvacEfficiency

  let state: SimulationState = {
    minute: 0,
    externalTemp: baseExternal,
    hvacOn: false,
    energyUsed_kWh: 0,
    rooms: ROOMS.reduce((acc, room) => {
      acc[room] = {
        temp: 72,
        occupied: false,
        targetTemp: 72,
        comfortViolations: 0,
        runtimeMinutes: 0,
      }
      return acc
    }, {} as Record<Room, RoomState>),
  }

  for (let i = 0; i < TOTAL_MINUTES; i++) {
    const hour = Math.floor((i % MINUTES_PER_DAY) / 60)
    state.minute = i
    const baseTemp = baseExternal + 10 * Math.sin((2 * Math.PI * (i % MINUTES_PER_DAY)) / MINUTES_PER_DAY)
    state.externalTemp = baseTemp + (rand() * 6 - 3) // ±3°F noise

    for (const room of ROOMS) {
      const roomState = state.rooms[room]

      const occProb = occupancy[room]?.[hour] ?? DEFAULT_OCC_PROB[room][hour]
      roomState.occupied = rand() < occProb

      if (roomState.occupied) {
        roomState.temp += TEMP_GAIN_PER_OCCUPANT
      } else {
        roomState.temp -= TEMP_LOSS_UNOCCUPIED
        roomState.temp += (state.externalTemp - roomState.temp) * 0.01
      }

      const target = isSentient ? (roomState.occupied ? 72 : 82) : 72
      roomState.targetTemp = target

      const needsCooling = roomState.temp > target
      if (needsCooling) {
        roomState.temp -= 0.3
        roomState.runtimeMinutes++
        state.energyUsed_kWh += hvacPower / 60
      }

      if (roomState.temp < COMFORT_RANGE.min || roomState.temp > COMFORT_RANGE.max) {
        roomState.comfortViolations++
      }
    }

    if (trace) log.push(JSON.parse(JSON.stringify(state)))
  }

  const comfortTotal = ROOMS.reduce((sum, r) => sum + state.rooms[r].comfortViolations, 0)
  const runtimeTotal = ROOMS.reduce((sum, r) => sum + state.rooms[r].runtimeMinutes, 0)

  const result: SimulationResult = {
    energyUsed_kWh: state.energyUsed_kWh,
    comfortViolations: comfortTotal,
    runtimeMinutes: runtimeTotal,
    seed,
  }
  if (trace) result.trace = log
  return result
}

export function runMonteCarlo(n: number, opts: Omit<SimulateOptions, 'seed'> & { seed?: string }) {
  const results: SimulationResult[] = []
  for (let i = 0; i < n; i++) {
    const seed = `${opts.seed ?? 'mc'}-${i}`
    results.push(simulate({ ...opts, seed }))
  }
  const energies = results.map(r => r.energyUsed_kWh)
  const mean = energies.reduce((a, b) => a + b, 0) / n
  const sorted = energies.slice().sort((a, b) => a - b)
  const median = sorted[Math.floor(n / 2)]
  const stdev = Math.sqrt(energies.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / n)
  return { meanEnergy_kWh: mean, medianEnergy_kWh: median, stdevEnergy_kWh: stdev, results }
}

// Convenience arrays for existing visualizer
export const legacyData = simulate({ isSentient: false, seed: 'legacy', trace: true }).trace!
export const sentientData = simulate({ isSentient: true, seed: 'sentient', trace: true }).trace!

if (require.main === module) {
  const legacy = simulate({ isSentient: false, seed: 'cli', trace: false })
  const sentient = simulate({ isSentient: true, seed: 'cli', trace: false })
  const reduction = ((legacy.energyUsed_kWh - sentient.energyUsed_kWh) / legacy.energyUsed_kWh) * 100
  console.log(`Legacy energy: ${legacy.energyUsed_kWh.toFixed(2)} kWh`)
  console.log(`SentientZone energy: ${sentient.energyUsed_kWh.toFixed(2)} kWh`)
  console.log(`Reduction: ${reduction.toFixed(2)}%`)
}