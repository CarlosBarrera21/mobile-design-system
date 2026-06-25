# AGENTS.md — Móviles

## Project structure

```
moviles/          Spring Boot 4.0.5 backend (Maven, Java 17)
moviles-frontend/ Vite 8 + React 19 frontend (JSX, no TypeScript)
moviles.sql       DB schema file
```

## Backend (`moviles/`)

- **Entrypoint**: `com.moviles.moviles.MovilesApplication`
- **Build/test**: `./mvnw spring-boot:run`, `./mvnw test`, `./mvnw clean package`
- **DB**: MySQL `moviles_db`, user `root`/`moviles123`, DDL mode `validate` (schema must pre-exist)
- **Models**: Movil, Brazo, Objeto, Hilo, Colgante (Lado enum: `izquierdo`/`derecho`)
- **Brazo**: `peso = longitud` auto-set on save in `BrazoService.guardar()`
- **Controllers with `@CrossOrigin`**: `BrazoController`, `ColganteController` (hardcoded to `http://localhost:5173`)
- **API endpoints**: `/moviles`, `/brazos`, `/objetos`, `/hilos`, `/colgantes`
- Uses Lombok, JPA, `@Transactional` on detail queries
- No separate typecheck step

## Frontend (`moviles-frontend/`)

- **Entrypoint**: `src/main.jsx` → `App.jsx`
- **Commands**: `npm run dev` (dev server :5173), `npm run build`, `npm run lint`, `npm run preview`
- **Vite proxy**: `/api` → `http://localhost:8080` (rewrites `/api` prefix away)
- **API client**: `src/services/api.js` — axios base URL `/api`
- Pure JSX (no TypeScript)
- Uses Konva (react-konva) for canvas rendering, Axios for HTTP
- **Dev order**: start backend first, then frontend

## Testing

- Backend: single `@SpringBootTest` context-load test (`./mvnw test`)
- Frontend: no test scripts configured

## Conventions

- `Agregar nivel superior` button text in UI uses advertencia checks (collision detection)
- `LONGITUDES_FIBONACCI = [7, 11, 18, 29, 47, 76, 123]` used for brazo length selection
