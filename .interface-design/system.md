# La Universidad en el Campo — Design System

## Intent

- **Who**: funcionarios del Comité de Cafeteros de Caldas / equipo CEPE revisando avance del programa, y consultantes públicos viendo el dashboard sin login. No son desarrolladores — necesitan entender estado (verde/amarillo/rojo) de un vistazo, no leer tablas crudas.
- **Task**: monitorear avance de objetivos/productos/actividades, ejecución financiera, beneficiarios e instituciones; para el admin, corregir datos puntuales sin fricción.
- **Feel**: cafetero/institucional — cálido pero serio, no corporativo genérico ni "SaaS azul y gris". Tierra, papel, café — no plástico frío.

## Palette (light — see `index.html` `:root`, dark variant follows CSS custom-property overrides in `[data-theme="dark"]`)

- `--azul:#0033A0` / `--azul-claro:#1E4FBF` / `--azul-oscuro:#001F63` — marca institucional CEPE.
- `--amarillo:#FFD100` / `--amarillo-suave:#FFF3C4` — marca institucional CEPE, usado en acentos (`.btn.primary`, `.pill`).
- `--tierra:#9A5B2E` / `--tierra-suave:#F0E3D2` — acento "cafetero" propio del proyecto (no viene del logo CEPE), usado para iconos de sección, hover de filas, fondos de actividades hijas.
- Semáforo: `--verde:#2F9E5B`, `--amarillo-sem:#DB9A1F`, `--rojo:#D6524B`, `--gris-sem:#9C8F7A`, `--azul-sem:#3B6FD6` — cada uno con variante `-suave` para fondos de badges/tags.
- Fondo cálido `--bg:#FAF6EF` (no blanco puro), tarjetas `--card:#FFFFFF` / `--card-2:#FFFDF9`.

## Typography

- Display (`h1,h2,h3,.section-title`, valores KPI): `Poppins`.
- Body (todo el resto): `Public Sans` — deliberadamente no `Inter` (impeccable lo marca como tell genérico de UI hecha por IA); Public Sans mantiene el tono institucional/gubernamental del brief original ("Inter o Poppins").

## Depth & elevation

- Shadows, no borders-only: `--shadow-sm/md/lg`, tonos cálidos (`rgba(58,38,10,...)` en light, `rgba(0,0,0,...)` en dark) — no shadows grises genéricas.
- Radius scale: `--radius-sm:9px` (inputs/botones/tags), `--radius-md:16px` (cards), `--radius-lg:22px` (hero card, modal).
- **Nunca** `border-left` de color en tarjetas de severidad/alerta — usar tinte de fondo (`--sev-alta` etc. → `background`). Es el tell #1 que detecta `impeccable`.

## Spacing & layout

- Grid base `.grid` con `align-items:start` (no `stretch` — el default de CSS Grid causaba una tarjeta corta como "Beneficiarios" a estirarse hasta el alto de su vecina "Alertas activas", dejando espacio vacío enorme).
- Tablas: header `th` con fondo `--azul` sólido y texto blanco (contraste fuerte, ancla visual de cada tabla).

## Component patterns (reusar, no reinventar)

- **Progreso**: siempre `transform:scaleX(pct/100)` con `transform-origin:left`, nunca animar `width` directamente (layout thrash). Helper: `scaleX(pct)` en el script.
- **Filas padre/hijo (producto → actividades)**: la actividad hija es una `<tr class="act-row">` de ancho completo con las mismas 5 columnas que la fila del producto, fondo `--tierra-suave`, e ícono `subArrow` + indentación en la primera celda — no un panel/acordeón separado. Mismo patrón reutilizado en Cronograma (fila de producto + sub-filas de actividad más pequeñas/claras con "↳").
- **Iconos**: sistema propio de SVG inline (`ICON_PATHS` + `icon()`), nunca emoji. ~25 iconos cubiertos; añadir ahí, no importar una librería.
- **Semáforo**: `badge-estado` con ícono + texto, no solo un punto de color (accesibilidad — no depender solo del color).
- **KPIs**: `arcGauge()` (aro SVG) para el avance técnico principal, `bulletStat()` (barra etiquetada) para métricas secundarias, `statusStrip()` (barra segmentada + leyenda) para conteo de productos por estado — variar la expresión del "número" según su importancia relativa, no repetir la misma caja en todos lados.
- **Edición admin**: un solo modal reutilizable (`openFormModal()`), nunca `prompt()/confirm()`. Sub-navegación dentro de una vista (como las 4 tablas del Panel admin) es un grupo de botones (`.admin-subnav`, pill activa en `--azul`/`--amarillo`), no pestañas de nivel superior — reservar la barra de tabs principal para las secciones de la app.
- **Estado mensual** (no_ejecutado/en_proceso/ejecutado): siempre los mismos 3 colores semáforo (gris/amarillo/verde) en cualquier presentación — celda de Cronograma, botón del modal, badge de Vista mensual — para que el usuario aprenda el código una sola vez.
- **Moneda**: `fmtCOP` = `'$' + Intl.NumberFormat('es-CO',{maximumFractionDigits:0})` — nunca `style:'currency'` de Intl directamente (inserta un espacio después del símbolo que se ve mal: "$ 855.878.775").

## Verification

Después de cualquier cambio visual no trivial: `node <impeccable-skill-dir>/scripts/detect.mjs --json` sobre `index.html`, debe devolver `[]`.
