# API — Backend Ucampo (Google Apps Script)

Formato de respuesta único: `{ "ok": true, "data": ... }` o `{ "ok": false, "error": "..." }`.

## Lecturas (GET, públicas, sin token)

| Acción | URL | Descripción |
|---|---|---|
| `getAll` | `?action=getAll` | Todo el dataset consolidado (una sola llamada para el dashboard público) |
| `getObjetivos` | `?action=getObjetivos` | Objetivos + avance técnico y financiero calculados |
| `getProductos` | `?action=getProductos` | Productos con `pct_esperado`, `color` y `estado` calculados en el momento de la lectura |
| `getActividades` | `?action=getActividades` | Actividades (hoja vacía hasta que se cargue el detalle) |
| `getMEL` | `?action=getMEL` | Indicadores MEL |
| `getBeneficiarios` | `?action=getBeneficiarios` | `{ individuales: [...], resumen: {...} }` — ver nota abajo |
| `getInstituciones` | `?action=getInstituciones` | 13 instituciones educativas rurales |
| `getFinanzas` | `?action=getFinanzas` | `{ por_objetivo, por_fuente, talento_humano }` |
| `getAlertas` | `?action=getAlertas` | Alertas automáticas (recalculadas) + manuales + resoluciones |
| `getDashboard` | `?action=getDashboard` | KPIs consolidados |

## Escrituras (POST, requieren `token` salvo `login`)

Body siempre JSON. Ejemplo genérico:
```json
{ "action": "updateProducto", "id": "P1.2", "cambios": { "pct_real": 80 }, "token": "..." }
```

| Acción | Campos requeridos | Descripción |
|---|---|---|
| `login` | `password` | Devuelve `{ token, expira_en_segundos }`. Token válido 30 min (`CONFIG.TOKEN_TTL_SECONDS`). |
| `updateProducto` | `id`, `cambios`, `token` | Actualiza columnas de PRODUCTOS por id. Solo modifica las columnas presentes en `cambios`. |
| `updateActividad` | `id`, `cambios`, `token` | Igual, sobre ACTIVIDADES. |
| `updateMEL` | `id`, `cambios`, `token` | Igual, sobre INDICADORES_MEL. |
| `createAlerta` | `tipo`, `severidad`, `descripcion`, `token` | Crea una alerta manual (p. ej. tipo `otro`). |
| `resolveAlerta` | `id`, `token` | Marca una alerta como resuelta. Funciona tanto para alertas manuales como automáticas (`AUTO-...`). |

## Decisiones de diseño importantes

- **`pct_esperado`, `color` y `estado` de un producto nunca se guardan**: se calculan en cada lectura a partir de `mes_inicio`, `mes_fin`, `pct_real` y `CONFIG.MES_ACTUAL` (ver `src/rules/semaforos.gs`). Esto evita que queden desactualizados si cambia el mes o el avance real. Actualiza `CONFIG.MES_ACTUAL` en `src/config.gs` cada mes (o automatízalo más adelante con una fecha real).
- **Las alertas automáticas tampoco se guardan**: se recalculan en cada `getAlertas`/`getDashboard` con un id determinístico (`AUTO-<tipo>-<referencia>`). La hoja `ALERTAS` solo persiste alertas manuales y "resoluciones" (una fila con el mismo id `AUTO-...` y `estado: resuelta`) para poder silenciar una alerta automática hasta que cambie la condición que la generó.
- **`BENEFICIARIOS` está vacía a propósito**: no se recibió un listado individual de beneficiarios en los documentos fuente (solo conteos agregados del Informe Técnico). `BENEFICIARIOS_RESUMEN` guarda esos conteos reales (género x categoría). Cuando exista el listado individual real, cárgalo en `BENEFICIARIOS` seguiendo el esquema de columnas ya creado.
- **`FINANZAS` combina dos desgloses en una sola hoja** distinguidos por la columna `tipo` (`objetivo` o `fuente`), porque hoy no existe el cruce completo objetivo × fuente en la fuente de datos.
- **No se pidió el scope de Google Drive** en `appsscript.json` (a diferencia del borrador original de la especificación): el backend solo lee/escribe su propio spreadsheet vinculado, por lo que basta el scope de Sheets.

## Autenticación

Un solo rol admin, contraseña compartida en `PropertiesService`. No vive en el código (este repo es público): se fija ejecutando `establecerPasswordAdmin('tu-contraseña')` una sola vez desde el editor de Apps Script (ver `src/setup.gs`). El token se guarda en `CacheService` y expira solo a los 30 minutos; no hay revocación manual en este prototipo.
