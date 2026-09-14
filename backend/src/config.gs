/**
 * Configuración global del backend.
 * El proyecto se crea con `clasp create --type sheets`, por lo que queda
 * vinculado (container-bound) a su propio Google Sheet: no se necesita
 * un ID de spreadsheet fijo, SpreadsheetApp.getActiveSpreadsheet() basta.
 */

const CONFIG = {
  TOKEN_TTL_SECONDS: 1800, // 30 minutos, según spec sección 14
  SHEETS: {
    OBJETIVOS: 'OBJETIVOS',
    PRODUCTOS: 'PRODUCTOS',
    ACTIVIDADES: 'ACTIVIDADES',
    INDICADORES_MEL: 'INDICADORES_MEL',
    BENEFICIARIOS: 'BENEFICIARIOS',
    BENEFICIARIOS_RESUMEN: 'BENEFICIARIOS_RESUMEN',
    INSTITUCIONES: 'INSTITUCIONES',
    FINANZAS: 'FINANZAS',
    TALENTO_HUMANO: 'TALENTO_HUMANO',
    ALERTAS: 'ALERTAS',
    LOGS: 'LOGS',
  },
  // Mes actual del proyecto para el cálculo de semáforos (Mar=1 ... Nov=9).
  // Se actualiza manualmente cada mes hasta que se automatice con fecha real.
  MES_ACTUAL: 6, // Agosto 2026
  // Fecha de corte de los datos (no la fecha en que se calcula la alerta).
  // Actualízala junto con MES_ACTUAL cada mes.
  FECHA_CORTE: '2026-08-31',
};

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/** Contraseña de administrador. Ver src/setup.gs para configurarla una sola vez. */
function getAdminPassword_() {
  const pass = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!pass) {
    throw new Error('ADMIN_PASSWORD no está configurada. Ejecuta configurarPropiedadesIniciales() una vez desde el editor de Apps Script.');
  }
  return pass;
}
