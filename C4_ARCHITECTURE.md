# C4 Architecture — EKAP React MFE

> C4 model levels: **Context → Containers → Components**
> Diagrams use [Mermaid C4](https://mermaid.js.org/syntax/c4.html) and render natively on GitHub.

---

## Level 1 — System Context

Who uses the system and what external systems does it depend on?

```mermaid
C4Context
    title System Context — EKAP React MFE

    Person(employee, "Employee", "Asks HR questions and submits self-service requests via the chat UI")
    Person(hr_admin, "HR Administrator", "Reviews flagged documents and manages name change requests")

    System(ekap, "EKAP Platform", "AI-powered HR chat assistant. Mini-apps are loaded at runtime via Webpack 5 Module Federation with React prop callbacks — no iframes")

    System_Ext(anthropic, "Anthropic Claude API", "LLM for intent classification, streaming chat synthesis, and document verification via Vision API")
    System_Ext(workday, "Workday (mocked)", "HR system of record — receives confirmed name changes after verification")

    Rel(employee, ekap, "Asks HR questions, submits name change requests", "HTTPS / Browser")
    Rel(hr_admin, ekap, "Reviews flagged documents", "HTTPS / Browser")
    Rel(ekap, anthropic, "Classifies intent, synthesises responses, verifies documents", "HTTPS / Anthropic API")
    Rel(ekap, workday, "Updates employee name records after verification", "HTTPS (mocked)")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## Level 2 — Containers

What are the independently deployable / runnable units and how do they communicate?

```mermaid
C4Container
    title Containers — EKAP React MFE

    Person(employee, "Employee", "Uses chat and name-change form")
    Person(hr_admin, "HR Admin", "Reviews flagged requests")

    System_Boundary(ekap, "EKAP Platform") {

        Container(shell, "Shell Host", "React 18 + Webpack 5, Nginx :3000", "MFE host application. Renders chat UI, action chips, side panel. Loads NameChangeApp from the remote bundle at runtime via Module Federation")
        Container(hr_namechange, "HR Name Change Remote", "React 18 + Webpack 5, Nginx :3001", "MFE remote. Exposes NameChangeApp component via remoteEntry.js. Accepts onComplete prop. No iframe, no postMessage")

        Container(chat_service, "Chat Service", "Python 3.12, FastAPI :8000", "Orchestrates conversation: intent classification, vertical routing, Claude streaming, Redis context management")
        Container(hr_service, "HR Service", "Java 21, Spring Boot WebFlux :8081", "HR vertical: policy RAG, name-change submissions, MinIO upload, Kafka event production")
        Container(doc_processor, "Doc Processor", "Python 3.12, aiokafka (background)", "Consumes Kafka events. Verifies documents with Claude Vision. Updates request status in PostgreSQL")

        ContainerDb(postgres, "PostgreSQL", "postgres:16 :5432", "Chat history, audit log, name-change request state and verification results")
        ContainerDb(redis, "Redis", "redis:7 :6379", "Per-session conversation context (last N turns, TTL-based)")
        ContainerDb(weaviate, "Weaviate", ":8080", "Vector store. Holds HR policy chunks. BM25 keyword search")
        ContainerDb(minio, "MinIO", "minio/minio :9000", "S3-compatible blob store for uploaded legal documents")
        Container(kafka, "Apache Kafka", "Confluent 7.6.0 :29092", "Event bus. Async document processing pipeline")
    }

    System_Ext(anthropic, "Anthropic Claude API", "LLM provider")

    Rel(employee, shell, "Opens chat, reads responses, clicks action chips", "HTTPS")

    Rel(shell, chat_service, "POST /chat/stream — SSE chunks + action suggestions", "HTTPS / SSE")
    Rel(shell, hr_namechange, "Fetches remoteEntry.js, renders <NameChangeApp onComplete={cb} />", "Webpack MFE / JS import")
    Rel(hr_namechange, shell, "Calls onComplete(requestId) prop on submit", "React prop callback")
    Rel(hr_namechange, hr_service, "POST /hr/name-change (multipart form)", "HTTPS")

    Rel(chat_service, hr_service, "POST /hr/query (vertical RAG)", "HTTP")
    Rel(chat_service, redis, "Get/set conversation context", "Redis protocol")
    Rel(chat_service, postgres, "Write audit events", "asyncpg")
    Rel(chat_service, weaviate, "BM25 keyword search on HR policies", "gRPC / HTTP")
    Rel(chat_service, anthropic, "Classify intent, stream synthesis", "HTTPS")

    Rel(hr_service, postgres, "Read/write name-change requests", "R2DBC")
    Rel(hr_service, minio, "Upload legal documents", "S3 API")
    Rel(hr_service, kafka, "Produce hr.name-change.submitted events", "Kafka")
    Rel(hr_service, weaviate, "BM25 search on HR policy collection", "gRPC")

    Rel(doc_processor, kafka, "Consume hr.name-change.submitted", "Kafka")
    Rel(doc_processor, minio, "Download documents for verification", "S3 API")
    Rel(doc_processor, anthropic, "Verify document via Claude Vision", "HTTPS")
    Rel(doc_processor, postgres, "Update request status", "asyncpg")

    Rel(hr_admin, hr_service, "Review NEEDS_HUMAN_REVIEW requests", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

---

## Level 3 — Components: Shell Host

What are the major internal components of the Shell Host container, and how does it wire up Module Federation?

```mermaid
C4Component
    title Components — Shell Host (React + Webpack 5 MFE Host)

    Container_Ext(chat_service, "Chat Service", "FastAPI :8000", "SSE streaming endpoint")
    Container_Ext(hr_remote, "HR Namechange Remote", "Webpack :3001", "Serves remoteEntry.js")

    Container_Boundary(shell_ct, "Shell Host :3000") {
        Component(webpack_cfg, "Webpack Config (MFE Host)", "ModuleFederationPlugin", "Declares hrNamechange remote URL. Configures shared React singleton. Generates host bundle and loads remoteEntry.js at runtime")
        Component(app, "App", "React root component", "Top-level layout: header with user info, sidebar navigation, main content area with router outlet")
        Component(chat_panel, "ChatPanel", "React component", "Owns all chat state: messages array, streaming buffer, loading flag, active action. Renders message list, input form, and SidePanel")
        Component(chat_bubble, "ChatBubble", "React component", "Renders a single conversation message. Supports markdown, error state, and streaming cursor animation")
        Component(action_chip, "ActionChip", "React component", "Clickable suggestion chip rendered below assistant messages. On click: calls ChatPanel.handleActionOpen(action)")
        Component(side_panel, "SidePanel", "React component", "Slide-over container. Renders RemoteLoader inside. Passes onComplete callback. Manages open/close/success states")
        Component(remote_loader, "RemoteLoader", "React lazy + Suspense", "Wraps dynamic import('hrNamechange/NameChangeApp') in Suspense boundary. Shows spinner while fetching remote bundle. Shows error fallback if remote unreachable")
        Component(chat_svc_client, "chatService.ts", "TypeScript fetch client", "streamChat(): opens SSE fetch, calls onToken per data:chunk event, calls onActions on data:done event with action_suggestions")
    }

    Rel(app, chat_panel, "renders")
    Rel(chat_panel, chat_bubble, "renders per message")
    Rel(chat_panel, action_chip, "renders per action suggestion")
    Rel(chat_panel, side_panel, "renders when activeAction != null, passes onComplete")
    Rel(chat_panel, chat_svc_client, "streamChat(request, onToken, onActions)")

    Rel(side_panel, remote_loader, "renders with onComplete prop")
    Rel(remote_loader, webpack_cfg, "triggers dynamic import resolution")
    Rel(webpack_cfg, hr_remote, "GET /remoteEntry.js at runtime", "HTTPS")

    Rel(chat_svc_client, chat_service, "POST /chat/stream", "HTTPS / SSE")
    Rel(action_chip, chat_panel, "handleActionOpen(action)", "onClick")
    Rel(remote_loader, side_panel, "onComplete(requestId)", "React prop callback from NameChangeApp")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

---

## Level 3 — Components: HR Namechange Remote

```mermaid
C4Component
    title Components — HR Namechange MFE Remote (React + Webpack 5)

    Container_Ext(shell_host, "Shell Host", "React :3000", "Imports NameChangeApp and passes onComplete prop")
    Container_Ext(hr_service, "HR Service", "Spring Boot :8081", "Name change submission endpoint")

    Container_Boundary(remote_ct, "HR Namechange Remote :3001") {
        Component(webpack_remote_cfg, "Webpack Config (MFE Remote)", "ModuleFederationPlugin", "Exposes ./NameChangeApp → src/NameChangeApp. Declares shared React singleton. Serves remoteEntry.js at root path")
        Component(namechange_app, "NameChangeApp", "React component (exposed entry)", "Thin wrapper component. Accepts { onComplete: (requestId: string) => void }. Renders NameChangeForm with the same callback")
        Component(namechange_form, "NameChangeForm", "React component", "Multi-field form: current name (read-only), new last name, document type select, file upload with drag-and-drop preview. Manages idle/submitting/success/error states")
        Component(namechange_status, "NameChangeStatus", "React component", "Displays submission result: request ID, processing timeline, next steps. Auto-redirects after 3 seconds by calling onComplete")
        Component(namechange_svc, "nameChangeService.ts", "TypeScript fetch client", "submitNameChange(): POST /hr/name-change as multipart/form-data. Returns { id, status }")
    }

    Rel(shell_host, namechange_app, "import('hrNamechange/NameChangeApp')", "Webpack MFE")
    Rel(shell_host, namechange_app, "passes onComplete prop", "React prop")

    Rel(namechange_app, namechange_form, "renders, forwards onComplete")
    Rel(namechange_form, namechange_svc, "submitNameChange(formData)")
    Rel(namechange_svc, hr_service, "POST /hr/name-change", "HTTPS multipart")
    Rel(namechange_form, namechange_status, "renders on success state")
    Rel(namechange_status, namechange_app, "calls onComplete(requestId)", "React prop callback")
    Rel(namechange_app, shell_host, "propagates onComplete(requestId)", "React prop callback")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## Level 3 — Components: Chat Service

```mermaid
C4Component
    title Components — Chat Service (Python FastAPI)

    Container_Ext(shell_host, "Shell Host", "React + Webpack", "Sends chat requests, consumes SSE")
    Container_Ext(hr_service, "HR Service", "Spring Boot", "HR vertical endpoint")
    Container_Ext(redis, "Redis", "Cache", "Conversation context store")
    Container_Ext(postgres, "PostgreSQL", "DB", "Audit log")
    Container_Ext(weaviate, "Weaviate", "Vector DB", "HR policy chunks")
    System_Ext(anthropic, "Anthropic Claude API", "LLM")

    Container_Boundary(chat_svc, "Chat Service :8000") {
        Component(chat_router, "Chat Router", "FastAPI /chat/stream", "POST endpoint. Orchestrates: context → intent → verticals → synthesis. Emits SSE chunks and final done event with action_suggestions")
        Component(intent_router, "Intent Router", "Python + Claude", "Sends message + context to Claude. Returns structured IntentClassification: verticals, sub_verticals, sensitivity_level, needs_clarification, is_status_check")
        Component(context_mgr, "Context Manager", "Python + Redis", "HGET/HSET per session. Provides last 20 turns to intent router and synthesiser. Saves each turn on completion")
        Component(vertical_client, "Vertical Client", "httpx async", "Fans out to vertical service URLs. Parses VerticalResponse (camelCase aliases for Java JSON). Collects RAG chunks and action_suggestions from each vertical")
        Component(synthesiser, "Synthesiser", "Python + Claude streaming", "Builds system prompt from vertical responses. Streams Claude tokens. Appends EAP disclaimer for HIGH_SENSITIVITY. Returns async generator")
        Component(audit_logger, "Audit Logger", "Python + asyncpg", "Appends QUERY_RECEIVED row with user_id, session_id, vertical, sensitivity_level")
        Component(config, "Config", "pydantic-settings", "Typed settings loaded from environment variables. Cached singleton")
    }

    Rel(shell_host, chat_router, "POST /chat/stream", "HTTPS / SSE")
    Rel(chat_router, context_mgr, "get_context(session_id)")
    Rel(chat_router, intent_router, "classify_intent(message, context, roles)")
    Rel(chat_router, vertical_client, "query_vertical(vertical, message)")
    Rel(chat_router, synthesiser, "synthesize_stream(message, responses)")
    Rel(chat_router, audit_logger, "log_event(...)")

    Rel(intent_router, anthropic, "Claude: classify intent → JSON", "HTTPS")
    Rel(context_mgr, redis, "HGET / HSET conversation:{id}", "Redis")
    Rel(vertical_client, hr_service, "POST /hr/query", "HTTP")
    Rel(synthesiser, anthropic, "Claude stream: generate answer", "HTTPS")
    Rel(synthesiser, weaviate, "BM25 fallback retrieval", "gRPC")
    Rel(audit_logger, postgres, "INSERT audit_logs", "asyncpg")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

---

## Module Federation Runtime Model

This diagram shows what actually happens inside the browser at runtime — the distinction that makes MFE different from an iframe:

```mermaid
C4Container
    title Module Federation Runtime — Browser JS Context

    System_Boundary(browser, "Single Browser Tab / JS Heap") {

        Container(shell_bundle, "Shell Bundle", "Webpack host chunks", "Contains App, ChatPanel, SidePanel, RemoteLoader, chatService. Does NOT bundle NameChangeApp at build time")
        Container(shared_react, "Shared React Instance", "react@18.3 singleton", "One copy of React shared by both host and remote. Declared eager:true so it loads before any components. Prevents 'Invalid Hook Call' errors")
        Container(remote_entry, "remoteEntry.js", "Webpack remote manifest", "Fetched from http://localhost:3001/remoteEntry.js at runtime when RemoteLoader mounts. Describes what modules the remote exposes and their chunk URLs")
        Container(remote_chunks, "Remote Chunks", "Webpack remote code chunks", "NameChangeApp + NameChangeForm + nameChangeService, downloaded from :3001 on first import. Cached by the browser thereafter")

        Container(name_change_cmp, "NameChangeApp (in host context)", "React component instance", "Runs inside the shell's JS heap. Has direct access to the onComplete function reference — no serialisation, no cross-origin boundary")
    }

    Container_Ext(remote_server, "HR Namechange Nginx :3001", "Static file server", "Serves remoteEntry.js and chunk files with CORS headers (Access-Control-Allow-Origin: *)")

    Rel(shell_bundle, shared_react, "imports react (gets singleton)")
    Rel(remote_chunks, shared_react, "imports react (gets same singleton)")
    Rel(shell_bundle, remote_entry, "fetch() at RemoteLoader mount time")
    Rel(remote_entry, remote_server, "describes chunk URLs at :3001")
    Rel(remote_chunks, remote_server, "downloaded on demand")
    Rel(shell_bundle, name_change_cmp, "renders <NameChangeApp onComplete={fn} />")
    Rel(name_change_cmp, shell_bundle, "calls onComplete(requestId) directly")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## Iframe vs. MFE Comparison (C4 Container Level)

```mermaid
C4Container
    title Mini-App Integration: Iframe Pattern vs. Module Federation Pattern

    System_Boundary(iframe_pattern, "Iframe Pattern (ekap-iframe)") {
        Container(shell_i, "Chat Shell", "React :3000", "Renders <iframe src=:3001>. Sets up postMessage listener")
        Container(mini_i, "Name Change App", "React :3001", "Runs in separate browsing context. Calls window.parent.postMessage on complete")
        Container(boundary, "Cross-Origin Boundary", "Browser security", "Separate JS heaps. No shared memory. Communication via structured-clone postMessage only")
    }

    System_Boundary(mfe_pattern, "Module Federation Pattern (ekap-react-mfe)") {
        Container(shell_m, "Shell Host", "React + Webpack :3000", "Imports NameChangeApp bundle at runtime. Renders in same JS heap")
        Container(mini_m, "NameChangeApp", "React (from :3001 remoteEntry)", "Executes in host JS heap. Receives onComplete as direct function reference")
        Container(shared, "Shared React Singleton", "react@18 eager", "One React instance. Hooks work. Context can be shared. ErrorBoundary catches remote errors")
    }

    Rel(shell_i, mini_i, "iframe src= URL", "Cross-origin embed")
    Rel(mini_i, shell_i, "window.parent.postMessage({type, requestId})", "Structured clone")
    Rel(shell_m, mini_m, "dynamic import() → <NameChangeApp onComplete={fn} />", "In-heap JS call")
    Rel(mini_m, shell_m, "fn(requestId)", "Direct function call")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```
