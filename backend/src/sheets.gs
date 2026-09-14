/**
 * Capa de acceso a Google Sheets: lee/escribe cada hoja como arreglos de
 * objetos usando la fila 1 como encabezados. Todos los servicios pasan
 * por aquí en lugar de llamar a SpreadsheetApp directamente.
 */

function getSheetByName_(nombre) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(nombre);
  if (!sheet) throw new Error('No existe la hoja "' + nombre + '". Ejecuta configurarPropiedadesIniciales() / crearHojas() primero.');
  return sheet;
}

/** Lee toda la hoja y la devuelve como arreglo de objetos {columna: valor}. */
function leerHojaComoObjetos_(nombreHoja) {
  const sheet = getSheetByName_(nombreHoja);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(c => c !== '' && c !== null))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] === '' ? null : row[i]; });
      return obj;
    });
}

/** Devuelve un solo registro por id (columna "id"), o null si no existe. */
function buscarPorId_(nombreHoja, id) {
  return leerHojaComoObjetos_(nombreHoja).find(r => r.id === id) || null;
}

/** Agrega una fila nueva a partir de un objeto. Agrega columnas nuevas si el objeto trae campos que aún no existen. */
function agregarFila_(nombreHoja, objeto) {
  agregarColumnasSiFaltan_(nombreHoja, Object.keys(objeto));
  const sheet = getSheetByName_(nombreHoja);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const fila = headers.map(h => (objeto[h] === undefined ? '' : objeto[h]));
  sheet.appendRow(fila);
}

/**
 * Agrega al final las columnas de `campos` que no existan todavía en la hoja.
 * Permite evolucionar el esquema (p. ej. añadir mes_inicio/mes_fin/pct_avance
 * a una hoja ya creada) sin tener que recrearla ni perder datos existentes.
 */
function agregarColumnasSiFaltan_(nombreHoja, campos) {
  const sheet = getSheetByName_(nombreHoja);
  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  campos.forEach(campo => {
    if (headers.indexOf(campo) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(campo);
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }
  });
}

/** Actualiza (merge) la fila cuyo "id" coincide, con los campos de `cambios`. Lanza error si no existe.
 *  Si `cambios` trae una clave que aún no es columna, la agrega automáticamente. */
function actualizarFilaPorId_(nombreHoja, id, cambios) {
  return actualizarFilaPorCampo_(nombreHoja, 'id', id, cambios);
}

/** Igual que actualizarFilaPorId_ pero permite usar cualquier columna como clave
 *  (p. ej. BENEFICIARIOS_RESUMEN se identifica por "categoria", no por "id"). */
function actualizarFilaPorCampo_(nombreHoja, campoClave, valorClave, cambios) {
  agregarColumnasSiFaltan_(nombreHoja, Object.keys(cambios));
  const sheet = getSheetByName_(nombreHoja);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const keyCol = headers.indexOf(campoClave);
  if (keyCol === -1) throw new Error('La hoja "' + nombreHoja + '" no tiene columna "' + campoClave + '".');
  for (let r = 1; r < values.length; r++) {
    if (values[r][keyCol] === valorClave) {
      headers.forEach((h, c) => {
        if (Object.prototype.hasOwnProperty.call(cambios, h)) {
          sheet.getRange(r + 1, c + 1).setValue(cambios[h]);
        }
      });
      return true;
    }
  }
  throw new Error('No se encontró el registro con ' + campoClave + ' "' + valorClave + '" en "' + nombreHoja + '".');
}

/** Como buscarPorId_ pero por cualquier columna. */
function buscarPorCampo_(nombreHoja, campoClave, valorClave) {
  return leerHojaComoObjetos_(nombreHoja).find(r => r[campoClave] === valorClave) || null;
}

/** Elimina la fila cuyo "id" coincide. Lanza error si no existe. */
function eliminarFilaPorId_(nombreHoja, id) {
  const sheet = getSheetByName_(nombreHoja);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('id');
  if (idCol === -1) throw new Error('La hoja "' + nombreHoja + '" no tiene columna "id".');
  for (let r = 1; r < values.length; r++) {
    if (values[r][idCol] === id) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  throw new Error('No se encontró el registro con id "' + id + '" en "' + nombreHoja + '".');
}

/** Crea una hoja con encabezados si no existe; si existe, no la modifica. */
function asegurarHojaConEncabezados_(nombre, encabezados) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(nombre);
  if (!sheet) {
    sheet = ss.insertSheet(nombre);
    sheet.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function registrarLog_(accion, detalle) {
  try {
    const sheet = getSpreadsheet_().getSheetByName(CONFIG.SHEETS.LOGS);
    if (sheet) sheet.appendRow([nowIso_(), accion, 'admin', JSON.stringify(detalle)]);
  } catch (e) {
    // El log nunca debe romper la operación principal.
  }
}
