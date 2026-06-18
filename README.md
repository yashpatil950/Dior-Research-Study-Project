# PACT + Sensor Capture (React)

React port of the PACT task plus baseline heart-rate capture from Mionix (mouse)
and EmotiBit, with a unified Admin dashboard.

## Flow

```
Login (name) → Baseline Start (120 s) → PACT → Baseline End (120 s) → Admin
```

At every data-collection screen the app shows red error banners if EmotiBit or
the Mionix mouse is disconnected, and disables the Start button until both are
online.

## Files downloaded per participant

| Screen          | File                                          |
| --------------- | --------------------------------------------- |
| Baseline Start  | `{name}_baseline_start_data.xlsx`             |
| PACT            | `{name}_PACT_data.xlsx`                       |
| Baseline End    | `{name}_baseline_end_data.xlsx`               |

Each workbook contains a `summary` sheet (averages, timing, status, unix ms) and
per-source raw sheets. Admin page mirrors the same summary on screen.

## Prerequisites for live data

1. **Mionix Device Hub** running (provides `ws://localhost:7681`).
2. **EmotiBit bridge** running locally:
   ```bash
   cd ..
   pip install websockets
   python3 emotibit_ws_bridge.py
   ```
   This translates EmotiBit UDP packets into the `ws://localhost:8765` WebSocket
   the app subscribes to.

## Running the app

```bash
npm install        # once
npm run dev        # http://localhost:5173
```

For a production build to deploy:

```bash
npm run build      # outputs dist/
npm run preview    # serves dist/ at http://localhost:4173 for verification
```

## Notes

- Per-participant session summaries live in browser `localStorage` under
  `pact_app.sessions`. Admin shows everything stored there; clearing browser data
  wipes it. The Excel files in Downloads are the canonical record.
- The PACT countdown timer covers the **recorded** Initiation + Planning blocks
  combined (practice is untimed). Default 5 minutes, configurable in the PACT
  setup screen. Turns red under 20 s; reaching 0 ends the task and marks status
  `time_expired`.
- All timings recorded use both ISO 8601 (`new Date().toISOString()`) and unix
  ms (`Date.now()`), so they line up with the EmotiBit bridge's `unix_ms` field.
