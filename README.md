# EKAP React MFE — Enterprise Knowledge & Action Platform

> **Integration pattern:** React Webpack 5 Module Federation (host + remote, React props callback)

An enterprise HR chat assistant where the action mini-apps are loaded at **runtime** via Webpack 5 Module Federation — no iframes, no `postMessage`. The shell and the HR name-change form are both standard React apps; the form is exposed as a federated remote and consumed by the shell host, which passes a plain React `onComplete` callback prop directly across the module boundary.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full component diagrams and data-flow walkthroughs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Shell Host | React 18, Webpack 5, TypeScript, Module Federation |
| HR Mini-App | React 18, Webpack 5, TypeScript (MFE remote, `remoteEntry.js`) |
| Chat Service | Python 3.12, FastAPI, Anthropic SDK, SSE streaming |
| HR Service | Java 21, Spring Boot 3.3, Spring WebFlux, R2DBC |
| Doc Processor | Python 3.12, aiokafka, Claude Vision API |
| Vector DB | Weaviate (BM25 keyword search) |
| Relational DB | PostgreSQL 16 |
| Cache | Redis 7 (conversation context) |
| Message Queue | Apache Kafka 7.6 (Confluent) + Zookeeper |
| Object Storage | MinIO (S3-compatible, document uploads) |
| LLM | `claude-sonnet-4-6` via Anthropic API |

---

## Prerequisites

- **Docker Desktop** (Apple Silicon arm64 or amd64)
- An **[Anthropic API key](https://console.anthropic.com/)**
- Python ≥ 3.10 on the host (for the one-time Weaviate seed scripts)

---

## Running the App

### 1 — Environment

```bash
cp .env.example .env
# Open .env and set ANTHROPIC_API_KEY=sk-ant-...
```

### 2 — Start all services

```bash
docker compose up -d
```

Wait ~60 s for health checks:

```bash
docker compose ps   # all should show "healthy" or "Up"
```

### 3 — Seed Weaviate *(first run only, or after `down -v`)*

```bash
python3 infra/weaviate/setup.py
python3 infra/weaviate/ingest.py
```

### 4 — Open the app

| URL | What it is |
|---|---|
| **http://localhost:3000** | Chat shell (MFE host) |
| http://localhost:3001/remoteEntry.js | MFE remote entry (loaded by host at runtime) |
| http://localhost:8000/docs | Chat Service OpenAPI docs |
| http://localhost:8081/actuator/health | HR Service health |

### 5 — Try it

1. Open **http://localhost:3000**
2. Ask: *"I would like to change my last name"*
3. Click the **Start Name Change Request** chip that appears
4. The `NameChangeApp` component loads from the remote bundle into the shell's side panel
5. Fill in the form and submit — the shell's `onComplete` callback fires with the request ID

### 6 — Stop

```bash
docker compose down          # stop, keep volumes
docker compose down -v       # stop + wipe all data
```

---

## Mini-App Integration Pattern

The `hr-namechange` webpack remote exposes one component:

```js
// webpack.config.js (remote)
exposes: { './NameChangeApp': './src/NameChangeApp' }
```

The shell host imports it at runtime with a React `Suspense` boundary:

```tsx
// Shell host
const NameChangeApp = lazy(() => import('hrNamechange/NameChangeApp'));

<Suspense fallback={<Spinner />}>
  <NameChangeApp onComplete={(requestId) => handleComplete(requestId)} />
</Suspense>
```

**No iframes, no `postMessage`, no globals** — `onComplete` is a plain React prop that crosses the module federation boundary. Both modules share a single React instance (declared `singleton: true, eager: true` in both webpack configs).

---

## Project Structure

```
ekap-react-mfe/
├── backend/
│   ├── chat-service/        # Python FastAPI — chat orchestration & SSE streaming
│   ├── hr-service/          # Java Spring Boot — HR vertical, name-change workflow
│   └── doc-processor/       # Python async — Kafka consumer, Claude Vision doc verify
├── frontend/
│   ├── shell/               # React/Webpack host — chat UI + MFE consumer
│   └── remotes/
│       └── hr-namechange/   # React/Webpack remote — exposes NameChangeApp
├── infra/
│   ├── postgres/migrations/ # SQL schema
│   ├── kafka/               # Topic init scripts
│   └── weaviate/            # setup.py + ingest.py
└── docker-compose.yml
```
