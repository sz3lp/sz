# SentientZone Clinic Simulator

This repo provides a TypeScript simulation of HVAC behavior in a four-room therapy clinic. The `simulate` function models 30 virtual days of runtime and outputs metrics such as energy usage, temperature variance, and comfort violations for a legacy thermostat versus SentientZone control.

To run the simulation:

```bash
# Compile to JavaScript
npx tsc simulator.ts
# Execute (or run through ts-node directly)
node simulator.js
```

The data produced can be exported, charted, or otherwise analyzed.
