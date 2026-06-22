# OOP — Desafíos de Diseño de Bajo Nivel (LLD) 2026

Implementaciones en **TypeScript** de los cinco desafíos contemporáneos de
Diseño de Bajo Nivel (Low-Level Design) propuestos en la actividad del
**22-06-2026**, aplicando rigurosamente principios **SOLID** y **patrones de
diseño**.

Cada desafío vive en su propia carpeta autocontenida (proyecto npm + tests).

| # | Desafío | Patrones clave | Estado |
|---|---------|----------------|--------|
| 1 | [Gilded Rose](./1-gilded-rose) — refactorización de código legado (OCP) | **Strategy** + **Factory** | ✅ Completo |
| 2 | [Vending Machine](./2-vending-machine) — máquina de estados y concurrencia | **State** + **Singleton** (+ Strategy) | ✅ Completo |
| 3 | [Parking Lot](./3-parking-lot) — asignación de recursos espaciales | **Facade** + **Strategy** + **Abstract Factory** | ✅ Completo |
| 4 | [Cab Booking](./4-cab-booking) (Uber) — sistemas distribuidos en tiempo real | **Observer** + **Strategy** + **State** | ✅ Completo |
| 5 | AI Agent Orchestration — orquestación de agentes IA | Command + State + Chain of Responsibility | ⏳ Pendiente |

## Cómo ejecutar un desafío

```bash
cd 1-gilded-rose
npm install
npm start     # ejecuta la prueba de concepto (demo en consola)
npm test      # corre la suite de pruebas
```

## Stack

- **Lenguaje:** TypeScript (ESM)
- **Ejecución / tests:** [`tsx`](https://github.com/privatenumber/tsx) + runner nativo `node:test`
- **Control de versión:** Git / GitHub
