/**
 * Datos que el dashboard necesita pero no se derivan de ninguna otra hoja
 * (% de ejecución territorial, estado general narrativo, deserción, universidades
 * aliadas, meta de beneficiarios). Antes vivían hardcodeados en index.html
 * (INFO_ADICIONAL) y por eso sobrevivieron al reinicio de datos pedido por el
 * usuario — ahora son una fila única editable desde Panel admin, igual que
 * el resto de la información.
 */
const InfoAdicionalService = {
  obtener() {
    const filas = leerHojaComoObjetos_(CONFIG.SHEETS.INFO_ADICIONAL);
    return filas[0] || {};
  },

  actualizar(body) {
    requireFields_(body, ['cambios']);
    actualizarFilaPorId_(CONFIG.SHEETS.INFO_ADICIONAL, 'INFO1', body.cambios);
    registrarLog_('updateInfoAdicional', { cambios: body.cambios });
    return this.obtener();
  },
};
