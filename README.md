# DUS ATLAS

"DUSOTĀJS" The Angular app shows stations on a Leaflet map. The Spring Boot API stores users, stations, and price suggestions in MongoDB.

## Requirements

- Docker Desktop
- JDK 21 (Eclipse Temurin)
- Node.js 22.22.3 or newer

## Setup

1. Start Docker Desktop, then create the database:

   ```powershell
   docker run -d --name dus-mongo -p 127.0.0.1:27017:27017 -v dus-mongo-data:/data/db --restart unless-stopped mongo:8
   ```

   If the container already exists: `docker start dus-mongo`

2. Create the backend env file:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

3. Install the frontend packages:

   ```powershell
   cd frontend
   npm install
   ```

## Run

Use two terminals and leave both open.

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

```powershell
cd frontend
npm start
```

Open http://localhost:4200. The dev server proxies `/api` to http://127.0.0.1:8080.

| Username | Password | Role |
|---|---|---|
| admin | ChangeMe-Strong123 | ADMIN |
| moderator | Moderator-Demo123 | MODERATOR |
| user | User-Demo12345 | USER |

These match `backend/.env.example`. Change them in `backend/.env` before the first backend start. Existing usernames are not updated.

## What each role can do

- **USER:** map and submit a price suggestion.
- **MODERATOR:** that, plus Piedāvājumi (approve, reject, or save a price directly).
- **ADMIN:** that, plus Lietotāji (create accounts).

## Data

Edit `backend/data/stations.json` to change the starter stations and prices. The backend reloads the file when it changes and replaces the station list in MongoDB. Prices saved through Piedāvājumi stay until the file is edited again.

`DUS_DATA_FILE` overrides the file path. It defaults to `data/stations.json`, relative to the `backend` directory.
