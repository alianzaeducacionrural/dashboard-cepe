# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This is not a git repository. [Contexto.html](Contexto.html) is the original functional/technical specification (in Spanish) for **"La Universidad en el Campo"**; treat it as the source-of-truth spec, but where it disagrees with what's actually been built (documented below), trust the code.

Current state: **fully connected end-to-end.**
- **[index.html](index.html)** — frontend, single static file, no build step, no external dependencies. Fetches all data live from the deployed backend (`GAS_URL` constant near the top of the `<script>` block) instead of holding static data — there is no local RULES/semáforo engine anymore, all computed fields (`pct_esperado`, `color`, `estado`, dashboard KPIs, alerts) come from the API. Public dashboard has no visible admin entry point; the admin panel opens only via `index.html?admin=1`, validated against a password stored server-side (never in this repo — see "Admin password" below), and it's a real session now — login gets a real token and writes actually hit the Sheet. Visual design went through a full pass using `/interface-design` + `/impeccable` + `/ui-ux-pro-max` (warm cafetero palette on `--bg:#FAF6EF`, `Poppins`/`Public Sans`, SVG icon system, elevation/border tokens, `transform:scaleX()` progress bars) — see "Visual design system" below before changing tokens or component patterns.
- Productos/Cronograma render **actividades as full-width sub-rows** directly under their parent producto row (same column structure, `subArrow` icon + tint background to differentiate), not a collapsible panel — see "Actividades & consolidation" below.
- All editing (productos, actividades, objetivos, MEL — create/edit/delete) is centralized in a dedicated **Panel admin** tab (`viewAdmin()`, only in the tab bar when `ADMIN_MODE`), not scattered pencil buttons across public views — see "Panel admin" below. Beneficiarios/Finanzas/Talento/Instituciones keep their original inline edit buttons (simpler flat data, unaffected by the tipo_medicion work). Cronograma and the "Vista mensual" tab are also admin-interactive for `tipo_medicion:'mensual'` items (click a month cell/button to cycle its status).
- All `prompt()`/`confirm()`/`alert()` browser dialogs were replaced by a single reusable in-app modal, `openFormModal({title, context, fields, rebuild, okLabel})` (near the top of the `<script>` block) — see "Form modal" below before adding any new admin input flow.
- **`backend/`** — Google Apps Script backend, deployed and live. `.clasp.json` holds the real `scriptId`; `clasp push`/`clasp deploy` from `backend/` push straight to production. The Sheet lives at the URL in `backend/README.md` §0, inside the institutional Drive folder (created via the `mcp__claude_ai_Google_Drive` connector, not `clasp create`, to guarantee it landed in the right shared folder). `inicializar()` has already been run once — re-running it is safe (idempotent) but **do not** re-run it thinking it will reset data; it only fills empty sheets.
- **`docs/`** — four real source documents the seed data was extracted from. Treat numbers in the app as already reconciled against these; re-derive only if the user supplies updated versions.

**Before editing backend code**: any `clasp push` / `clasp deploy` from `backend/` affects the live Sheet and the live Web App immediately — there's no staging environment. Treat it accordingly (confirm with the user first, per the destructive/external-effects policy), and re-run the Node-mocked test harness (see "Testing the backend") before pushing.

**Admin password**: this repo is public on GitHub, so the real password is never committed. `configurarPropiedadesIniciales()` in `backend/src/setup.gs` no longer hardcodes it — set or change it by running `establecerPasswordAdmin('the-real-password')` once from the Apps Script editor (script.google.com), which writes it to `PropertiesService` directly (never through git). Pushing new backend code does not touch the already-stored password (`PropertiesService` persists independently of source deploys).

There are no build/lint commands for the frontend (plain HTML/CSS/JS) — validate it by loading the extracted `<script>` body in Node with `fetch` pointed at the real `GAS_URL` and calling each `view*()` function (this is how the Fase 2 wiring was verified; see conversation history or just redo it against the live URL). For the backend, there's no local test runner either — GAS code is validated by loading it into a mocked GAS environment in Node (see "Testing the backend" below) and, once deployed, via `tests/test_services.gs` run from the Apps Script editor.

## What this project is

A web app for the Comité de Cafeteros de Caldas / CEPE program to centralize tracking of the "La Universidad en el Campo" initiative: objectives, products, activities, MEL indicators, beneficiaries, finances, and HR, with traffic-light status indicators and automated alerts. It has two access levels: a public read-only dashboard (no login) and a password-protected admin panel for data entry (no per-user auth — a single shared password).

## Planned architecture

- **Frontend**: Phase 1 is a single static `index.html` with embedded CSS/JS (no build step) to validate design. Phase 2 migrates to React + Vite + TypeScript + Tailwind, deployed to GitHub Pages via `npm run build` → `dist/`.
- **Backend**: Google Apps Script (GAS), developed locally and deployed with `clasp` (not the Apps Script web editor), stored in the institutional Drive folder alongside the Sheet, docs, and backups. Published as a Web App (`doGet`/`doPost`) acting as a JSON REST API, called from the frontend via `fetch`.
- **Database**: Google Sheets, with one sheet per entity, accessed only through Apps Script (never directly by the frontend).
- **Auth**: no user accounts. Admin panel checks a single password stored via `PropertiesService`; on success the backend issues a short-lived token cached in `CacheService` (30 min) that must be sent with every write request.

### Backend layout (`backend/`, code complete, not yet deployed)

```
backend/
├── .claspignore / appsscript.json / package.json   # .clasp.json is created by `clasp create` (not in repo — no scriptId yet)
├── README.md            # exact setup steps for the user (clasp login/create/push/deploy)
├── src/
│   ├── main.gs          # doGet, doPost, router
│   ├── config.gs        # CONFIG (sheet names, CONFIG.MES_ACTUAL, token TTL)
│   ├── utils.gs         # jsonSuccess_/jsonError_, validation helpers
│   ├── sheets.gs        # generic sheet <-> object read/write helpers
│   ├── setup.gs         # inicializar() — one-time: creates all sheets + seeds real Aug-2026 data + sets admin password
│   ├── services/        # objetivos, productos, actividades, mel, beneficiarios, instituciones, finanzas, talento, alertas, dashboard, auth
│   └── rules/           # semaforos.gs, alertas.gs — status/alert computation, mirrors index.html's RULES engine
├── tests/test_services.gs   # run `ejecutarTodasLasPruebas` from the Apps Script editor
└── docs/API.md          # endpoint reference + key design decisions (see below)
```

**Deployment requires the user, not the agent** — `clasp login` and `clasp create` are interactive Google OAuth flows and `clasp create` provisions real cloud resources (a new Sheet + Apps Script project). The agent should write/edit backend code freely but must not attempt to run these; hand the user the exact commands (already in `backend/README.md`) instead. Once `.clasp.json` exists (has a real `scriptId`), `clasp push` and `clasp deploy` are safe to suggest but still confirm before running, per the destructive/external-effects policy.

### Testing the backend

There's no GAS test runner locally. To validate logic changes before asking the user to deploy, mock the GAS globals (`SpreadsheetApp`, `PropertiesService`, `CacheService`, `ContentService`, `Utilities`, `Logger`) in Node with an in-memory sheet backing `getDataRange/getRange/appendRow`, concatenate the `.gs` files in dependency order (config → utils → sheets → rules → services → main → setup) into one `Function(...)` body, then call `inicializar()`, `doGet`, `doPost`, and `ejecutarTodasLasPruebas` directly. This caught real issues during development (e.g. verifying token gating, semáforo recalculation, and that `inicializar()` is idempotent) — it's worth doing again after any change to `rules/`, `services/`, or `setup.gs`.

### Frontend layout (Phase 2, under `frontend/`)

```
frontend/src/
├── api/gas.ts            # fetch client for the GAS backend
├── components/           # Header, Tabs, KPI, Semaforo, Card, AlertItem, Table, Chart
├── modules/              # one per functional module (Dashboard, Productos, Cronograma, MEL, Beneficiarios, Finanzas, Instituciones, Alertas, Admin)
├── hooks/                # useData, useTheme
├── types/
└── utils/                # format.ts, export.ts (PDF/Excel export)
```

## Data model (11 Google Sheets — implemented in `backend/src/setup.gs`, deviates slightly from `Contexto.html` §7)

`OBJETIVOS`, `PRODUCTOS` (FK → objetivo_id), `ACTIVIDADES` (FK → producto_id), `INDICADORES_MEL`, `BENEFICIARIOS` (per-record, currently empty — no individual roster was ever provided), `BENEFICIARIOS_RESUMEN` (aggregate counts, the real data we actually have), `INSTITUCIONES` (no `egresados_*` columns — that tracking doesn't exist yet, only the tool to build it does), `FINANZAS` (one sheet, rows tagged `tipo: objetivo|fuente` since the objetivo×fuente cross isn't available), `TALENTO_HUMANO`, `ALERTAS`, `LOGS`. Full rationale for every deviation from the original spec schema is in [backend/docs/API.md](backend/docs/API.md) — read that before assuming a spec field exists in the real sheet.

`PRODUCTOS` columns: `id, objetivo_id, nombre, peso, mes_inicio, mes_fin, tipo_medicion, pct_real, meta, alcanzado, estados_mensuales, valor_ejecutado, responsable, observaciones`. `ACTIVIDADES` columns: `id, producto_id, nombre, mes_inicio, mes_fin, tipo_medicion, meta, alcanzado, completada, estados_mensuales, responsable, fecha_realizacion, evidencia, observaciones`. New columns get appended automatically by `agregarColumnasSiFaltan_` (in `sheets.gs`) whenever `agregarFila_`/`actualizarFilaPorId_` reference a field that doesn't have a header yet — this is how every schema change so far (meta/alcanzado/completada, then tipo_medicion/estados_mensuales) landed on the live sheet without a manual migration or data loss. Prefer this over hand-editing the sheet when a service needs a new field. `eliminarFilaPorId_`/`eliminarFilaPorCampo_`-style deletes use plain `sheet.deleteRow()`.

## Actividades & consolidation (see `backend/src/rules/semaforos.gs`)

Not every producto is a single deliverable — several ("Canasta educativa" being the original example) are actually 2-4 sub-activities with independent timelines and progress (e.g. Currículo Base, Currículo Específico, Bienestar universitario, Prácticas académicas). Modeling these as one hand-set `pct_real` on the producto caused real data drift (a stored `25%` when the true average was `52.2%`). Fixed architecturally, not just by correcting the number:

- **`computarProducto_(producto, mesActual, actividadesDelProducto)`** — when a producto has actividades, its `mes_inicio`/`mes_fin` become the min/max across all its actividades' computed ranges, and its `pct_real` becomes the average of their `pct_avance`. **Never edit a producto's own pct/dates/tipo_medicion once it has actividades** — those fields become derived and any edit to them would be silently overridden on the next read; the admin UI (`abrirEdicionProductoAdmin`) already accounts for this (edits are limited to `peso`/`responsable`/`valor_ejecutado`/`observaciones` when actividades exist).
- **Three explicit measurement types**, chosen per producto/actividad via its `tipo_medicion` field (not inferred anymore, except for old rows missing the column, which still fall back to the pre-existing inference for backward compatibility):
  - **`'manual'`** (productos only, the default) — `pct_real` is a plain number the admin sets directly.
  - **`'meta'`** — `meta` + `alcanzado` fields, `pct = alcanzado/meta*100` (e.g. "17 de 191 estudiantes"). For actividades this replaces the old inferred `meta>0` check.
  - **`'simple'`** (actividades only) — boolean `completada`, `pct = 100` or `0`. Actividades' non-meta default.
  - **`'mensual'`** (productos and actividades) — `estados_mensuales` is a JSON string keyed by month number (`{"3":"ejecutado","4":"en_proceso"}`), one of `ejecutado`(1)/`en_proceso`(0.5)/`no_ejecutado`(0, default); `calcularPctPorMeses_(json, mesInicio, mesFin)` averages those across the item's month range. This is what powers the clickable month cells in Cronograma/Vista mensual (`ciclarMes()` in `index.html`, cycling `no_ejecutado → en_proceso → ejecutado`).
- Any new service or report that reads productos must go through `ProductosService.listar()` (which passes actividades into `computarProducto_`) rather than calling `computarProductos_`/`leerHojaComoObjetos_(PRODUCTOS)` directly — `ObjetivosService` and `rules/alertas.gs` were both fixed to do this; a direct read would silently reintroduce the drift bug.

## Panel admin (`viewAdmin()` in `index.html`, tab only shown when `ADMIN_MODE`)

Full CRUD surface, organized as 4 sub-tabs (internal buttons, not top-level tabs) mirroring the backend services: **Objetivos** (edit only — nombre/descripción/presupuestado/ejecutado/orden; there are only 3, fixed by program design, no create/delete), **Productos** and **Actividades** (create/edit/delete; the edit modal's `tipo_medicion` select is `reactive:true` so choosing manual/meta/mensual re-renders the rest of the form via `camposMedicionProducto()`/`camposMedicionActividad()` — see "Form modal" below), **Indicadores MEL** (create/edit/delete). Every write goes through the matching backend action (`updateObjetivo`, `createProducto`/`deleteProducto` — deleting a producto cascade-deletes its actividades — `createActividad`/`deleteActividad`, `createMEL`/`deleteMEL`) then `cargarDatos()` to refresh.

## Form modal (`openFormModal()` near the top of `<script>`, replaces all `prompt()`/`confirm()`/`alert()`)

Single reusable modal (`#formModal` in the static HTML) driven by a `fields` array: `{key, label, type, value, options, reactive, mesInicio, mesFin}`.
- Types: `text`/`number`/`textarea`/`checkbox`/`select` (options can be plain strings or `{value,label}` pairs — use the latter when the id and display text differ, e.g. objetivo/producto pickers) and `meses` (a button per month in `[mesInicio, mesFin]`, click cycles `no_ejecutado → en_proceso → ejecutado`; serializes to the same JSON format `estados_mensuales` expects).
- **Reactivity**: pass `rebuild(currentValues)` alongside a field marked `reactive:true` (only wired for `select`) — on change it re-renders the body with whatever field set `rebuild` returns, without closing the modal. Always build `rebuild` as `(vals) => camposX(Object.assign({}, originalObject, vals))` so edits made before switching types aren't lost.
- `confirmModal(message, okLabel)` wraps the same modal with zero fields for yes/no confirmations (delete buttons use this instead of `confirm()`).
- Resolves `null` on cancel/background-click, or `{key: value}` on save (never throws) — callers still validate/guard on the result themselves (see any `abrirEdicion*Admin` function for the pattern: check `!TOKEN` first, then `if(!cambios) return;`).

## Visual design system (see `index.html` `<style>` block)

Built via `/interface-design` (intent-first direction) + `/ui-ux-pro-max` (palette/type/icon lookups) + `/impeccable` (mechanical AI-tell detector, `detect.mjs`) in one pass. Key decisions, so future edits don't regress them:
- Warm "cafetero" palette on a `#FAF6EF` background (`--azul`, `--amarillo`, `--tierra` tokens), `Poppins` for display type and `Public Sans` for body — **not `Inter`**, which `impeccable` flags as an overused AI-generated-UI tell.
- No emoji anywhere; all icons are inline SVG via the `ICON_PATHS`/`icon()` system.
- Alert/severity cards (`.sev-alta/media/baja`) use background tints, **not** `border-left` accent bars — `impeccable` flags a colored left border as one of the most recognizable AI-UI tells.
- Progress bars animate via `transform:scaleX()` (with `transform-origin:left`), never `transition:width` — avoids layout thrash flagged by the detector. Use the existing `scaleX(pct)` helper.
- The base `.grid` class sets `align-items:start` — needed because grid's default `stretch` will silently stretch short cards to match a tall sibling (this caused a real empty-space bug in the Beneficiarios/Ejecución presupuestal cards).
- Re-run `node <impeccable-skill-dir>/scripts/detect.mjs --json` against `index.html` after any non-trivial visual change and confirm it returns `[]` before considering the change done.

## Business rules (computed at read-time, never stored)

`pct_esperado`, semáforo `color`, and `estado` for a producto — and all automated alerts — are **derived on every GET** by the backend (`backend/src/rules/semaforos.gs` + `rules/alertas.gs`), never written to a sheet. The frontend has no rules engine of its own anymore — it only renders whatever the API returns. If semáforo/alert logic needs to change, it only needs to change in `backend/src/rules/`.

**Semáforo per producto** (based on `pct_real` vs `pct_esperado`):
- 🟢 Verde: `pct_real >= pct_esperado`
- 🟡 Amarillo: `pct_real >= pct_esperado * 0.85` and `< pct_esperado`
- 🔴 Rojo: `pct_real < pct_esperado * 0.5`, or past due and incomplete
- ⚪ Gris: not started (`pct_real = 0`)
- 🔵 Azul: `pct_real = 100`

**Automated alerts** (see section 9 of `Contexto.html` for the full trigger table): `retraso_producto`, `indicador_sin_medir`, `desviacion_financiera`, `desercion`, `producto_proximo_vencer`. The two prioritized alert types are product delays and unmeasured MEL indicators.

## API surface (implemented — `backend/src/main.gs`)

All responses use `{ ok: true/false, data: ..., error: ... }`. Reads are `GET ?action=get<Entity>` / `?action=getAll` / `?action=getDashboard` (public, no token). Writes are `POST` with `{ action, ..., token }` for `updateObjetivo`, `createProducto`/`updateProducto`/`deleteProducto`, `createActividad`/`updateActividad`/`deleteActividad`, `createMEL`/`updateMEL`/`deleteMEL`, `updateBeneficiarios` (keyed by `categoria`, not `id`), `updateInstitucion`, `updateFinanza`, `updateTalento`, `createAlerta`, `resolveAlerta`, and `login` (`{password}` → `{token, expira_en_segundos}`, 30 min TTL via `CacheService`). `backend/docs/API.md` documents the original (pre-admin-panel) surface — treat this list as the current source of truth until it's updated.

## Export

PDF export uses `jsPDF` + `html2canvas` in the frontend; Excel export uses `SheetJS (xlsx)`. Both are triggered per-module plus a consolidated report button on the dashboard — no server-side report generation.

## Brand/visual constants

CEPE colors: yellow `#FFD100`, blue `#0033A0`, light blue `#1E4FBF`. Semáforo colors: green `#22C55E`, yellow `#EAB308`, red `#EF4444`, gray `#94A3B8`.
