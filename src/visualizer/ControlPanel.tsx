import React from 'react'
import { legacyData, sentientData } from '../../simulator'
import { saveAs } from 'file-saver'

const ROOMS = ['TherapyA', 'TherapyB', 'Waiting', 'Admin'] as const

type DataPoint = typeof legacyData[number]

function sumEnergy(data: DataPoint[]) {
  return data.reduce((sum, tick) => sum + tick.energyUsed_kWh, 0)
}

function sumComfortViolations(data: DataPoint[]) {
  return data.reduce((sum, tick) => {
    for (const room of ROOMS) sum += tick.rooms[room].comfortViolations
    return sum
  }, 0)
}

function sumRuntimeMinutes(data: DataPoint[]) {
  return data.reduce((sum, tick) => {
    for (const room of ROOMS) sum += tick.rooms[room].runtimeMinutes
    return sum
  }, 0)
}

function downloadCSV(label: 'legacy' | 'sentient', data: DataPoint[]) {
  const header = ['Minute', 'Room', 'Temp', 'Occupied', 'TargetTemp', 'ComfortViolations', 'RuntimeMinutes']
  const rows: string[] = []

  data.forEach((tick, i) => {
    for (const room of ROOMS) {
      const r = tick.rooms[room]
      rows.push([i, room, r.temp, r.occupied, r.targetTemp, r.comfortViolations, r.runtimeMinutes].join(','))
    }
  })

  const blob = new Blob([[header.join(',')].concat(rows).join('\n')], { type: 'text/csv' })
  saveAs(blob, `${label}_sentientzone_sim.csv`)
}

export default function ControlPanel() {
  const totalEnergyLegacy = sumEnergy(legacyData)
  const totalEnergySentient = sumEnergy(sentientData)

  const totalComfortLegacy = sumComfortViolations(legacyData)
  const totalComfortSentient = sumComfortViolations(sentientData)

  const totalRuntimeLegacy = sumRuntimeMinutes(legacyData)
  const totalRuntimeSentient = sumRuntimeMinutes(sentientData)

  const energySaved = totalEnergyLegacy - totalEnergySentient
  const runtimeReduction = 100 * (1 - totalRuntimeSentient / totalRuntimeLegacy)
  const comfortDelta = totalComfortLegacy - totalComfortSentient

  return (
    <div className="p-4 border rounded-md shadow-sm bg-white mb-8">
      <h2 className="text-xl font-bold mb-2">Simulation Summary</h2>
      <ul className="space-y-1 text-sm">
        <li><strong>Total Energy Saved:</strong> {energySaved.toFixed(2)} kWh</li>
        <li><strong>Runtime Reduction:</strong> {runtimeReduction.toFixed(1)}%</li>
        <li><strong>Comfort Incidents Avoided:</strong> {comfortDelta}</li>
      </ul>

      <div className="mt-4 space-x-4">
        <button
          onClick={() => downloadCSV('legacy', legacyData)}
          className="px-3 py-1 border rounded bg-red-100 hover:bg-red-200"
        >
          Export Legacy CSV
        </button>
        <button
          onClick={() => downloadCSV('sentient', sentientData)}
          className="px-3 py-1 border rounded bg-green-100 hover:bg-green-200"
        >
          Export SentientZone CSV
        </button>
      </div>
    </div>
  )
}
