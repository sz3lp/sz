import React from 'react'
import { Line } from 'react-chartjs-2'
import { legacyData, sentientData } from '../../simulator'
import ControlPanel from './ControlPanel'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Title,
  Tooltip,
} from 'chart.js'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Title, Tooltip)

const MINUTES_PER_DAY = 24 * 60
const DAYS = 30
const ROOMS = ['TherapyA', 'TherapyB', 'Waiting', 'Admin'] as const

type SimulationState = (typeof legacyData)[number]

function computeDailySeries(data: SimulationState[]) {
  const energy: number[] = []
  const violations: number[] = []
  const avgTempsByRoom: Record<string, number[]> = {}

  for (const room of ROOMS) {
    avgTempsByRoom[room] = []
  }

  for (let day = 0; day < DAYS; day++) {
    const slice = data.slice(day * MINUTES_PER_DAY, (day + 1) * MINUTES_PER_DAY)
    let dailyEnergy = 0
    let dailyViolations = 0
    const roomTemps: Record<string, number[]> = {}

    for (const room of ROOMS) {
      roomTemps[room] = []
    }

    for (const minute of slice) {
      dailyEnergy += minute.energyUsed_kWh
      for (const room of ROOMS) {
        dailyViolations += minute.rooms[room].comfortViolations
        roomTemps[room].push(minute.rooms[room].temp)
      }
    }

    energy.push(parseFloat(dailyEnergy.toFixed(2)))
    violations.push(dailyViolations)

    for (const room of ROOMS) {
      const avg = roomTemps[room].reduce((a, b) => a + b, 0) / MINUTES_PER_DAY
      avgTempsByRoom[room].push(parseFloat(avg.toFixed(2)))
    }
  }

  return { energy, violations, avgTempsByRoom }
}

export default function VisualizerPage() {
  const legacy = computeDailySeries(legacyData)
  const sentient = computeDailySeries(sentientData)

  const days = Array.from({ length: DAYS }, (_, i) => `Day ${i + 1}`)

  return (
    <div className="p-6 space-y-12">
      <h1 className="text-2xl font-bold">SentientZone Simulation Comparison</h1>
      <ControlPanel />

      {/* Energy Usage */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Daily Energy Usage (kWh)</h2>
        <Line
          data={{
            labels: days,
            datasets: [
              {
                label: 'Legacy Thermostat',
                data: legacy.energy,
                borderColor: 'red',
                tension: 0.3,
              },
              {
                label: 'SentientZone',
                data: sentient.energy,
                borderColor: 'green',
                tension: 0.3,
              },
            ],
          }}
        />
      </div>

      {/* Comfort Violations */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Daily Comfort Violations</h2>
        <Line
          data={{
            labels: days,
            datasets: [
              {
                label: 'Legacy Thermostat',
                data: legacy.violations,
                borderColor: 'red',
                tension: 0.3,
              },
              {
                label: 'SentientZone',
                data: sentient.violations,
                borderColor: 'green',
                tension: 0.3,
              },
            ],
          }}
        />
      </div>

      {/* Room Temperature Averages */}
      {ROOMS.map((room) => (
        <div key={room}>
          <h2 className="text-xl font-semibold mb-2">{room} – Avg Daily Temp (°F)</h2>
          <Line
            data={{
              labels: days,
              datasets: [
                {
                  label: 'Legacy Thermostat',
                  data: legacy.avgTempsByRoom[room],
                  borderColor: 'red',
                  tension: 0.3,
                },
                {
                  label: 'SentientZone',
                  data: sentient.avgTempsByRoom[room],
                  borderColor: 'green',
                  tension: 0.3,
                },
              ],
            }}
          />
        </div>
      ))}
    </div>
  )
}
