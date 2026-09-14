/**
 * Helpers genéricos: respuestas JSON y validaciones básicas.
 * Formato de respuesta unificado, según spec sección 11.6:
 *   { ok: true/false, data: ..., error: ... }
 */

function jsonSuccess_(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError_(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: String(message) }))
    .setMimeType(ContentService.MimeType.JSON);
}

function requireFields_(obj, fields) {
  const faltantes = fields.filter(f => obj[f] === undefined || obj[f] === null || obj[f] === '');
  if (faltantes.length) {
    throw new Error('Faltan campos requeridos: ' + faltantes.join(', '));
  }
}

function generarId_(prefijo) {
  return prefijo + '-' + Utilities.getUuid().slice(0, 8);
}

function nowIso_() {
  return new Date().toISOString();
}
