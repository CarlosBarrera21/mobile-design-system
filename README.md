# Mobiles — Kinetic Mobile Designer

An interactive tool for designing, simulating, and validating kinetic sculptures (mobiles). Built with Spring Boot 4 + React 19.

## Features

- **Multi-level mobile designer** — build mobiles recursively, level by level
- **Equilibrium engine** — torque balance calculations include arm weight (`weight = length`)
- **Fibonacci arm lengths** — only standard lengths allowed: `[7, 11, 18, 29, 47, 76, 123]` cm
- **NFZ collision detection** — No-Fly Zone validation prevents horizontal overlap between sub-trees and vertical hilo-to-object collisions
- **Real-time 2D visualization** — interactive Cartesian plane with zoom, pan, and coordinate readout
- **NFZ toggle** — show/hide collision zones on the canvas
- **Recursive weight calculation** — each brazo's total weight includes itself and all child subtrees
- **Thread (hilo) management** — create and assign threads with minimum-length recommendations

## Architecture

```
moviles/               Spring Boot 4.0.5 backend
  ├── model/           JPA entities (Movil, Brazo, Objeto, Hilo, Colgante)
  ├── service/         Business logic + NFZ validation
  ├── controller/      REST API
  └── repository/      Spring Data JPA

moviles-frontend/      Vite 8 + React 19 frontend
  ├── components/      React components
  │   ├── PlanoCartesiano.jsx    Konva canvas rendering + NFZ visualization
  │   ├── FormularioBrazo.jsx    Arm creation wizard (3-step)
  │   ├── FormularioMovil.jsx    Mobile form
  │   ├── FormularioObjeto.jsx   Object form (unused)
  │   └── DetalleMovil.jsx       Recursive detail view
  └── services/        Axios API client
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Java 17+, Spring Boot 4.0.5, JPA/Hibernate, MySQL 8 |
| Frontend | React 19, Vite 8, react-konva, Axios |
| Validation | Server-side NFZ (No-Fly Zone), Fibonacci length enforcement |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/moviles` | List all mobiles |
| GET | `/api/moviles/{id}/detalle` | Full mobile tree |
| POST | `/api/brazos` | Create brazo (rejects non-Fibonacci) |
| GET | `/api/brazos/sugerir-minimo?obj1Id=X&obj2Id=Y` | Suggest minimum arm length |
| GET | `/api/brazos/{id}/peso-total` | Recursive subtree weight |
| POST | `/api/colgantes` | Create colgante (NFZ validated) |
| GET | `/api/hilos` | List threads |

## Getting Started

### 1. Database

```sql
CREATE DATABASE moviles_db;
```

### 2. Backend

```bash
cd moviles
./mvnw spring-boot:run
```

Runs on `http://localhost:8080`. Auto-validates schema against `moviles_db`.

### 3. Frontend

```bash
cd moviles-frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. Proxies `/api` to the backend.

## Key Calculations

### Torque Equilibrium (with arm weight)

```
d_izq = L × (w_ligero + L/2) / (w_pesado + w_ligero + L)
d_der = L − d_izq
```

Arm weight contributes its own torque as a point load at center of mass.

### Horizontal Collision (NFZ)

```
lMinSinColision = derechoReach(izq) + izquierdoReach(der) + 1cm(NFZ margin)
```

`derechoReach` and `izquierdoReach` are computed recursively through all sub-tree levels.

### Arm Weight Convention

```
peso = longitud   // e.g., a 76cm arm weighs 76g
```

## License

MIT

# Móviles — Kinetic Mobile Designer

An interactive tool for designing, simulating, and validating kinetic sculptures (mobiles). Built with Spring Boot 4 + React 19.

## Features

- **Multi-level mobile designer** — build mobiles recursively, level by level
- **Equilibrium engine** — torque balance calculations include arm weight (`weight = length`)
- **Fibonacci arm lengths** — only standard lengths allowed: `[7, 11, 18, 29, 47, 76, 123]` cm
- **NFZ collision detection** — No-Fly Zone validation prevents horizontal overlap between sub-trees and vertical hilo-to-object collisions
- **Real-time 2D visualization** — interactive Cartesian plane with zoom, pan, and coordinate readout
- **NFZ toggle** — show/hide collision zones on the canvas
- **Recursive weight calculation** — each brazo's total weight includes itself and all child subtrees
- **Thread (hilo) management** — create and assign threads with minimum-length recommendations

## Architecture

```
moviles/               Spring Boot 4.0.5 backend
  ├── model/           JPA entities (Movil, Brazo, Objeto, Hilo, Colgante)
  ├── service/         Business logic + NFZ validation
  ├── controller/      REST API
  └── repository/      Spring Data JPA

moviles-frontend/      Vite 8 + React 19 frontend
  ├── components/      React components
  │   ├── PlanoCartesiano.jsx    Konva canvas rendering + NFZ visualization
  │   ├── FormularioBrazo.jsx    Arm creation wizard (3-step)
  │   ├── FormularioMovil.jsx    Mobile form
  │   ├── FormularioObjeto.jsx   Object form (unused)
  │   └── DetalleMovil.jsx       Recursive detail view
  └── services/        Axios API client
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Java 17+, Spring Boot 4.0.5, JPA/Hibernate, MySQL 8 |
| Frontend | React 19, Vite 8, react-konva, Axios |
| Validation | Server-side NFZ (No-Fly Zone), Fibonacci length enforcement |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/moviles` | List all mobiles |
| GET | `/api/moviles/{id}/detalle` | Full mobile tree |
| POST | `/api/brazos` | Create brazo (rejects non-Fibonacci) |
| GET | `/api/brazos/sugerir-minimo?obj1Id=X&obj2Id=Y` | Suggest minimum arm length |
| GET | `/api/brazos/{id}/peso-total` | Recursive subtree weight |
| POST | `/api/colgantes` | Create colgante (NFZ validated) |
| GET | `/api/hilos` | List threads |

## Getting Started

### 1. Database

```sql
CREATE DATABASE moviles_db;
```

### 2. Backend

```bash
cd moviles
./mvnw spring-boot:run
```

Runs on `http://localhost:8080`. Auto-validates schema against `moviles_db`.

### 3. Frontend

```bash
cd moviles-frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. Proxies `/api` to the backend.

## Key Calculations

### Torque Equilibrium (with arm weight)

```
d_izq = L × (w_ligero + L/2) / (w_pesado + w_ligero + L)
d_der = L − d_izq
```

Arm weight contributes its own torque as a point load at center of mass.

### Horizontal Collision (NFZ)

```
lMinSinColision = derechoReach(izq) + izquierdoReach(der) + 1cm(NFZ margin)
```

`derechoReach` and `izquierdoReach` are computed recursively through all sub-tree levels.

### Arm Weight Convention

```
peso = longitud   // e.g., a 76cm arm weighs 76g
```

## License

MIT
