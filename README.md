# SentientZone Clinic Simulator

This repo provides a TypeScript simulation of HVAC behavior in a four-room therapy clinic. The updated `simulate` function now introduces stochastic occupancy, weather noise, and equipment efficiency drift. It still reports metrics such as energy usage, temperature variance, and comfort violations for a legacy thermostat versus SentientZone control.

The helper `runMonteCarlo` function can execute multiple simulations and return basic statistics across the runs.

To run the simulation:

```bash
# Compile to JavaScript
npx tsc simulator.ts
# Execute a single run
node simulator.js

# Or run a Monte Carlo study in the Node REPL
# const { runMonteCarlo } = require('./simulator.js')
# console.log(runMonteCarlo(100, { isSentient: true }))
```

The data produced can be exported, charted, or otherwise analyzed.
