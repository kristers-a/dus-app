# THIS IS A PROTOTYPE MADE PURELY FOR EDUCATIONAL PURPOSES

## Documentation

### Overview

DUS ATLAS ("DUSOTĀJS") is a map of fuel stations in Latvia with prices for PETROL_95, PETROL_98, DIESEL and LPG. Logged-in users can suggest a price for a station, and moderators approve or reject those suggestions. The interface is in Latvian.

### Architecture

```
Browser (Angular + Leaflet) → /api (dev proxy) → Spring Boot API → MongoDB
        localhost:4200                          127.0.0.1:8080     localhost:27017
```

- **Frontend:** Angular, lazy-loaded routes `/login`, `/register`, `/map`, `/moderation` (ADMIN, MODERATOR) and `/users` (ADMIN). Unknown routes redirect to `/map`. `proxy.conf.json` forwards `/api/**` to the backend.
- **Backend:** Spring Boot (Java 21), package `lv.dus.backend`, bound to `127.0.0.1` only.
- **Database:** MongoDB 8, database `dus-app`. Collections: `users`, `stations`, `priceSuggestions`, `appMeta`.

### Project structure

```
backend/
  data/stations.json            Editable demo stations and prices
  .env.example                  Template for backend/.env
  src/main/java/lv/dus/backend/
    auth/        AuthController (csrf, register, me)
    user/        UserController (admin), AppUser, UserRepository
    station/     StationController, Station, PriceEstimator
    suggestion/  SuggestionController, PriceService, PriceSuggestion, PriceRequest
    data/        DemoDataService, DemoData (stations.json loading and validation)
    config/      SecurityConfig, LocalSeed (demo accounts, "local" profile only)
    common/      ApiErrors
frontend/src/app/
  core/          auth.service, auth.guard, csrf.interceptor, station.service, models
  features/      login, register, map, moderation, users
  shared/        header component
```

### Authentication and security

- **Sessions, not JWT.** Login is a Spring Security form login at `POST /api/auth/login` (form fields `username` and `password`). Success returns `204`, failure returns `401`. The session lives in a `JSESSIONID` cookie (HttpOnly, SameSite=Lax, 30 minute timeout).
- **CSRF protection** is on. The frontend calls `GET /api/auth/csrf`, which returns `{ token, headerName }`, and sends the token in that header on state-changing requests (see `csrf.interceptor.ts`).
- **Passwords** are hashed with BCrypt. Passwords must be 12 to 64 characters.
- **Roles** are enforced in `SecurityConfig`:
  - `/api/auth/csrf`, `/api/auth/login`, `/api/auth/register`: public
  - `/api/users/**`: ADMIN
  - `/api/moderation/**`: ADMIN or MODERATOR
  - everything else: any logged-in user
- Unauthenticated requests get `401`, and requests with insufficient role get `403`.

### API reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/auth/csrf` | public | CSRF token and header name |
| POST | `/api/auth/login` | public | Log in (form-encoded), `204` on success |
| POST | `/api/auth/logout` | session | Log out, `204` |
| POST | `/api/auth/register` | public | Self-register as `USER`. Body: `{ username, password }`. `201`, or `409` if the name is taken |
| GET | `/api/auth/me` | logged in | `{ username, role }` |
| GET | `/api/stations` | logged in | All stations, with estimated prices filled in |
| GET | `/api/stations/{id}` | logged in | One station, or `404` |
| GET | `/api/stations/sources` | logged in | Price source list from `stations.json` |
| POST | `/api/price-suggestions` | logged in | Submit a suggestion. Body: `PriceRequest`. `201`, creates a `PENDING` suggestion |
| GET | `/api/moderation/suggestions` | MODERATOR+ | Pending suggestions, oldest first |
| POST | `/api/moderation/suggestions/{id}/review` | MODERATOR+ | Body: `{ "decision": "APPROVED" \| "REJECTED", "reason": "..." }`. A reason is required when rejecting. `409` if already reviewed |
| PUT | `/api/moderation/prices` | MODERATOR+ | Save a price directly. Body: `PriceRequest` |
| GET | `/api/users` | ADMIN | List users |
| POST | `/api/users` | ADMIN | Create a user. Body: `{ username, password, role }` |

`PriceRequest`:

```json
{ "stationId": "ck-brivibas-265", "fuelType": "PETROL_95", "price": "1.789" }
```

Price rules: the price is a string with at most 3 decimals, greater than 0 and no more than 10 (EUR/L). `fuelType` must be one the station sells. A suggestion equal to the station's current price is rejected.

### Data model

**users** (`AppUser`): `id`, `username` (unique index, created by the local seed), `passwordHash`, `role` (`USER` | `MODERATOR` | `ADMIN`), `enabled`

**stations** (`Station`): `id`, `name`, `address`, `latitude`, `longitude`, `description`, `chain`, `stationType`, `demo`, `fuels`, `fuelPrices[]`, `priceHistory[]`
- `FuelPrice`: `fuelType`, `price`, `updatedAt`, `kind` (`listed` | `estimated_group` | `estimated_chain` | `estimated_market`), `source`, `sourceUrl`, `effectiveDate`
- `HistoryPoint`: `fuelType`, `price`, `date`

**priceSuggestions** (`PriceSuggestion`): `id`, `stationId`, `fuelType`, `proposedPrice`, `submittedBy`, `submittedAt`, `status` (`PENDING` | `APPROVED` | `REJECTED`), `reviewedBy`, `reviewedAt`, `rejectionReason`

**appMeta**: one document (`_id: "demo-data"`) holding the SHA-256 hash of the last synced `stations.json`.

### Price suggestion workflow

1. A logged-in user submits a suggestion. It is validated and stored as `PENDING`.
2. A moderator sees pending suggestions under **Piedāvājumi**.
3. **Approve:** the station's price for that fuel is replaced, a point is added to `priceHistory`, and the suggestion becomes `APPROVED`. **Reject:** a reason is required, the suggestion becomes `REJECTED`, and the station is unchanged.
4. Moderators can also save a price directly with `PUT /api/moderation/prices`, skipping the suggestion step.
5. Prices saved this way are labelled with the source "Moderators".

### Price estimates

If a station sells a fuel but has no listed price for it, `GET /api/stations` computes an estimate on the fly, without storing it. It uses the median of listed prices for the same fuel, trying in order: same chain and station type (`estimated_group`), same chain (`estimated_chain`), then all stations (`estimated_market`). `estimateOffsetsCents` in `stations.json` adds a per-chain correction in cents.

### Stations file (`backend/data/stations.json`)

Top-level keys:

| Key | Purpose |
|---|---|
| `info` | Human-readable notes (ignored by the app) |
| `sources` | Per-chain source label, update date, URL, optional note |
| `estimateOffsetsCents` | Per-chain cents added to estimates |
| `stations` | Station definitions |
| `observations` | Price history entries |

Station entry:

```json
{
  "id": "ck-brivibas-265",
  "name": "Circle K Brīvības 265",
  "chain": "circlek",
  "stationType": "staffed",
  "address": "Brīvības gatve 265, Rīga",
  "latitude": 56.9871,
  "longitude": 24.1832,
  "fuels": ["PETROL_95", "PETROL_98", "DIESEL", "LPG"]
}
```

Observation entry:

```json
{
  "stationId": "ck-brivibas-265",
  "fuel": "PETROL_95",
  "price": 1.819,
  "effectiveDate": "2026-11-06",
  "sourceUrl": "https://www.circlek.lv/degviela-miles/degvielas-cenas"
}
```

Use `"networkWide": true` and `"chain": "..."` instead of `stationId` to apply a price to every station of that chain that sells the fuel. For each fuel, the latest `effectiveDate` is the current price and earlier entries form the history.

**Allowed values and limits** (the file is rejected if any are violated):
- `chain`: `circlek`, `virsi`, `neste`, `viada`, `straujupite`, `kool`, `other`
- `stationType`: `automated`, `staffed`, `unknown`
- `fuel`: `PETROL_95`, `PETROL_98`, `DIESEL`, `LPG`
- Price: 0.8 to 3.5 EUR/L (LPG: 0.5 to 2.0)
- `effectiveDate`: `YYYY-MM-DD`
- Coordinates must be inside Latvia (latitude 55.6 to 58.1, longitude 20.9 to 28.3)
- Station ids must be unique, and each observation must reference a station that sells that fuel

**Reload behaviour:** the file is checked for changes at startup and on each request to `/api/stations`. If the content changed, the stations collection is synced from the file: stations are overwritten by id and stations no longer in the file are deleted. This also overwrites prices saved through Piedāvājumi. If the file is invalid, an error is logged and the last good data is kept.

### Configuration (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URI` | none (set in `.env.example`) | MongoDB connection string |
| `MONGODB_DATABASE` | `dus-app` | Database name |
| `SERVER_PORT` | `8080` | Backend port |
| `DUS_DATA_FILE` | `data/stations.json` | Stations file path, relative to `backend/` |
| `DEMO_ADMIN_PASSWORD` | none | Password for `admin` (12 to 64 chars) |
| `DEMO_MODERATOR_PASSWORD` | none | Password for `moderator` |
| `DEMO_USER_PASSWORD` | none | Password for `user` |

The three demo accounts are created only when the `local` Spring profile is active, and only if the username does not already exist. Startup fails if a needed password is missing or outside 12 to 64 characters.

### Tests

```powershell
cd backend
.\mvnw.cmd test
```

Covers the price estimator (`PriceEstimatorTest`), validation of the demo data (`DemoDataValidationTest`), and application startup (`BackendApplicationTests`).
