const InstitucionesService = {
  listar() {
    return leerHojaComoObjetos_(CONFIG.SHEETS.INSTITUCIONES);
  },

  actualizar(body) {
    requireFields_(body, ['id', 'cambios']);
    actualizarFilaPorId_(CONFIG.SHEETS.INSTITUCIONES, body.id, body.cambios);
    registrarLog_('updateInstitucion', { id: body.id, cambios: body.cambios });
    return buscarPorId_(CONFIG.SHEETS.INSTITUCIONES, body.id);
  },
};
