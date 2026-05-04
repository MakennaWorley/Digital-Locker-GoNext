# Digital Locker — Private Asset Vault

A portfolio project demonstrating a hybrid **Go + Next.js** stack. The backend streams files directly from local disk using `io.Copy`; the frontend provides a dark, slate-themed vault dashboard for browsing assets and generating time-limited download links.

```
filesharing/
├── backend/          # Go · Gin · GORM · SQLite
│   ├── main.go
│   ├── go.mod
│   ├── database/
│   │   └── database.go
│   ├── handlers/
│   │   └── handlers.go
│   └── models/
│       └── models.go
└── frontend/         # Next.js 14 · Tailwind CSS · Lucide React
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── components/
    │   └── VaultDashboard.tsx
    └── lib/
        └── api.ts
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Go   | ≥ 1.21  |
| Node | ≥ 18    |
| gcc  | any (required by the SQLite CGO driver) |

> **macOS**: `gcc` ships with Xcode Command Line Tools — `xcode-select --install`.

---

## Running the Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set DIGITAL_LOCKER_API_KEY to a strong secret
go mod tidy          # download dependencies & generate go.sum
go run main.go       # starts on :8080, creates locker.db automatically
```

### Seed a file

**Via Frontend UI:**
- Click the **Add Asset** button in the header
- Enter the asset name and local path
- Click "Register Asset"

**Via cURL:**
```bash
# Register a local file path in the vault
curl -X POST http://localhost:8080/files \
  -H "Content-Type: application/json" \
  -d '{"name": "Doom ROM", "local_path": "./assets/doom.rom"}'
```

---

## Running the Frontend

```bash
cd frontend
cp ../.env.example .env.local  # optional: copy template
# Edit .env.local and set NEXT_PUBLIC_API_KEY to match backend secret
npm install
npm run dev          # starts on :3000
```

Open [http://localhost:3000](http://localhost:3000).

### Frontend Features

- **Add Asset** button to register new files by name and path
- **Generate Link** button with options for:
  - Max downloads (0 = unlimited, 1 = one-time link)
  - Expiration time (1 hour to 1 week)
- **Delete** button (trash icon) to remove assets from the vault
- **Copy** button to quickly copy download links
- Dark slate theme with Tailwind CSS
- Real-time updates when files are added/deleted

---

## Security

### API Key Protection

The `/keys` endpoint (used to generate download links) is protected by an optional API key. This prevents randoms from creating links.

**Backend setup:**
```bash
cd backend
echo "DIGITAL_LOCKER_API_KEY=your-random-secret-key" > .env
# e.g., DIGITAL_LOCKER_API_KEY=$(openssl rand -hex 32)
go run main.go
```

**Frontend setup:**
```bash
cd frontend
echo "NEXT_PUBLIC_API_KEY=your-random-secret-key" >> .env.local
npm run dev
```

If `DIGITAL_LOCKER_API_KEY` is not set, the backend skips validation.

### Download Limits

Each link can have a **max use count**:
- `max_uses: 0` = unlimited downloads (default)
- `max_uses: 1` = one-time download (perfect for sensitive files)
- `max_uses: N` = exactly N downloads allowed

Once the limit is reached, the link becomes invalid.

### Time Expiration

All keys have an expiration time:
- Default: 24 hours
- Configurable: 1 hour to 1 week (UI), or any custom time (API)

Downloads after expiry are rejected with a 403 Forbidden response.

---

## API Reference

| Method | Endpoint           | Description                                      |
|--------|--------------------|--------------------------------------------------|
| GET    | `/files`           | List all registered vault assets                 |
| POST   | `/files`           | Register a new asset `{ name, local_path }`      |
| DELETE | `/files`           | Delete an asset `{ file_id }`                    |
| POST   | `/keys`            | Generate a key `{ file_id, expires_at? }`        |
| GET    | `/download/:key`   | Validate key, increment use_count, stream file   |

### Generate key — request body

```json
{
  "file_id": 1,
  "max_uses": 1,                          // optional: 0 = unlimited (default)
  "expires_at": "2026-12-31T23:59:59Z"    // optional, defaults to +24 h
}
```

**Requires header:**
```
X-API-Key: <DIGITAL_LOCKER_API_KEY>
```

### Delete file — request body

```json
{
  "file_id": 1
}
```

---

## Tech Stack

**Backend**
- [Gin](https://github.com/gin-gonic/gin) — HTTP router
- [GORM](https://gorm.io) — ORM with SQLite driver
- [google/uuid](https://github.com/google/uuid) — UUID key generation
- [gin-contrib/cors](https://github.com/gin-contrib/cors) — CORS middleware

**Frontend**
- [Next.js 14](https://nextjs.org) App Router
- [Tailwind CSS](https://tailwindcss.com) — utility-first styling
- [Lucide React](https://lucide.dev) — icon set
