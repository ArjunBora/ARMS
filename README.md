# A.R.M.S. (Autonomous Reliability Management System)
### Predicting the Pulse of Industrial Power
**Luminous APOGEE '26 Hackathon**

> "We don't just monitor failures; we predict the mechanical heartbeat of the grid."

---

## Project Vision
In the world of industrial power, a single relay failure isn't just a technical glitch—it's a significant financial risk. A.R.M.S. is an autonomous ecosystem designed to bridge the gap between legacy hardware and intelligent maintenance. 

By combining Deterministic Physics with Non-Linear Machine Learning, A.R.M.S. provides an Early Warning System that detects microscopic degradation in inverter relays months before they reach a breaking point.

---

## Live Ecosystem Links
| Platform | Access Link | Description |
|----------|-------------|-------------|
| **Mobile PWA** | [armsinv.vercel.app](https://armsinv.vercel.app/) | Premium, mission-control interface for field engineers. |
| **Industrial Dashboard** | [ThingsBoard Live](https://eu.thingsboard.cloud/dashboard/d8776a50-3969-11f1-971b-83c0a6dd70cf?publicId=756172b0-397a-11f1-92f7-cbbd42e0f134) | Primary industrial SCADA view for real-time fleet monitoring. |

---

## System Architecture
The pipeline is optimized for zero-latency Edge Intelligence.

1.  **The Pulse (Simulator)**: A physics-accurate Modbus TCP engine simulating inverter transients.
2.  **The Nerve (Unified Bridge)**: An edge-computing gateway that polls raw registers and performs high-speed feature engineering.
3.  **The Brain (Hybrid AI)**: An integrated RUL (Remaining Useful Life) engine that fuses Arrhenius physics with LSTM-based ML confidence.
4.  **The Command (PWA/SCADA)**: Dual-stream visualization for both enterprise and mobile-first field inspection.

---

## File Organization

```text
ARMS/
├── go.py                       # Unified system orchestrator
├── .env.local                  # Local environment configuration
│
├── backend/                    # Core logic and system gateway
│   ├── inverter_sim.py         # Modbus TCP hardware simulator
│   ├── modbus_mqtt_bridge.py   # Edge-AI gateway & MQTT publisher
│   ├── rul_engine.py           # Hybrid PIML inference module
│   └── requirements.txt        # Python dependency list
│
├── pwa-dashboard/              # Next.js mobile-first application
│   ├── src/                    # UI components and telemetry context
│   ├── public/                 # Static assets and demo configurations
│   └── tailwind.config.js      # Design system configuration
│
├── models/                     # Pre-trained AI artifacts
│   ├── relay_rul_model.joblib  # Trained inference model
│   └── relay_rul_scaler.joblib # Feature normalization scaler
│
├── docs/                       # Technical setup & reference
│   └── THINGSBOARD_SETUP.md    # Dashboard replication guide
│
├── assets/                     # Visual assets & schematics
│   └── inverter_relay_schematic.png
│
└── utils/                      # Connectivity & diagnostic tools
    └── find_device.py          # Network device discovery utility
```

---

## Technical Edge
*   **Physics-First Initialization**: Models are accurate from Day 1. We use mechanical formulas to understand the baseline before the first data point is recorded.
*   **Arc Energy Mapping**: The system calculates specific arcing energy per switch using inverter current and overload registers to identify invisible thermal fatigue.
*   **Deterministic Safety Guardrails**: A secondary physics layer provides a "Veto" system, triggering critical alerts on mechanical limits even if the AI confidence is high.

---

## Developer Setup
```powershell
# 1. Start the Pulse & Brain
python go.py

# 2. View the Future
# Access the PWA or ThingsBoard link via the Ecosystem Links above.
```

---

## Contributors
Built with precision for APOGEE '26 by Arjun Bora & Arin Bhuyan.
