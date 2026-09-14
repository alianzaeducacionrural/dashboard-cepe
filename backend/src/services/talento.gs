/** Expuesto como parte de getFinanzas (ver FinanzasService); función propia por si se necesita un endpoint independiente más adelante. */
const TalentoService = {
  listar() {
    return leerHojaComoObjetos_(CONFIG.SHEETS.TALENTO_HUMANO);
  },

  actualizar(body) {
    requireFields_(body, ['id', 'cambios']);
    actualizarFilaPorId_(CONFIG.SHEETS.TALENTO_HUMANO, body.id, body.cambios);
    registrarLog_('updateTalento', { id: body.id, cambios: body.cambios });
    return buscarPorId_(CONFIG.SHEETS.TALENTO_HUMANO, body.id);
  },
};
