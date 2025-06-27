/**
 * SentientZone Simulation Engine – 30 Day Virtual Clinic Model
 * Simulates HVAC runtime, temperature drift, occupancy, and energy usage.
 */

 type Room = 'TherapyA' | 'TherapyB' | 'Waiting' | 'Admin'
 
 type RoomState = {
   temp: number
   occupied: boolean
   targetTemp: number
   comfortViolations: number
   runtimeMinutes: number
 }
 
 type SimulationState = {
   minute: number
   rooms: Record<Room, RoomState>
   externalTemp: number
   hvacOn: boolean
   energyUsed_kWh: number
 }
 
 const SIM_DAYS = 30
 const MINUTES_PER_DAY = 24 * 60
 const TOTAL_MINUTES = SIM_DAYS * MINUTES_PER_DAY
 
 const ROOMS: Room[] = ['TherapyA', 'TherapyB', 'Waiting', 'Admin']
 
 const COMFORT_RANGE = { min: 68, max: 74 }
 const HVAC_POWER_KW = 4.29 // Typical for 5-ton unit
 const TEMP_GAIN_PER_OCCUPANT = 0.2 // °F/min
 const TEMP_LOSS_UNOCCUPIED = 0.1 // °F/min
 
 function simulate(isSentient: boolean): SimulationState[] {
   const log: SimulationState[] = []
 
   let state: SimulationState = {
     minute: 0,
     externalTemp: 78,
     hvacOn: false,
     energyUsed_kWh: 0,
     rooms: Object.fromEntries(
       ROOMS.map((room) => [
         room,
         {
           temp: 72,
           occupied: false,
           targetTemp: 72,
           comfortViolations: 0,
           runtimeMinutes: 0,
         },
       ])
     ) as Record<Room, RoomState>,
   }
 
   for (let i = 0; i < TOTAL_MINUTES; i++) {
     state.minute = i
     state.externalTemp = 72 + 10 * Math.sin((2 * Math.PI * (i % MINUTES_PER_DAY)) / MINUTES_PER_DAY)
 
     for (const room of ROOMS) {
       const roomState = state.rooms[room]
 
       // Fake occupancy schedule
       roomState.occupied =
         room === 'TherapyA' || room === 'TherapyB'
           ? (i % MINUTES_PER_DAY >= 9 * 60 && i % MINUTES_PER_DAY <= 17 * 60 && Math.floor(i / 60) % 2 === 0)
           : i % MINUTES_PER_DAY >= 8 * 60 && i % MINUTES_PER_DAY <= 18 * 60
 
       // Temperature dynamics
       if (roomState.occupied) {
         roomState.temp += TEMP_GAIN_PER_OCCUPANT
       } else {
         roomState.temp -= TEMP_LOSS_UNOCCUPIED
         roomState.temp += (state.externalTemp - roomState.temp) * 0.01 // passive gain
       }
 
       // Determine control
       const target = isSentient
         ? roomState.occupied
           ? 72
           : 76 // idle setpoint
         : 72 // always fixed in legacy
 
       roomState.targetTemp = target
 
       const needsCooling = roomState.temp > target
       if (needsCooling) {
         roomState.temp -= 0.3
         roomState.runtimeMinutes++
         state.energyUsed_kWh += HVAC_POWER_KW / 60
       }
 
       if (roomState.temp < COMFORT_RANGE.min || roomState.temp > COMFORT_RANGE.max) {
         roomState.comfortViolations++
       }
     }
 
     log.push(JSON.parse(JSON.stringify(state)))
   }
 
   return log
 }
 
 // Usage:
 const legacyData = simulate(false)
 const sentientData = simulate(true)
 
 // Export, analyze, or chart legacyData vs sentientData
