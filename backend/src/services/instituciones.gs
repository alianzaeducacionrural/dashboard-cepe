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

  crear(body) {
    requireFields_(body, ['nombre']);
    const institucion = {
      id: body.id || generarId_('IE'),
      nombre: body.nombre,
      sede: body.sede || '',
      estudiantes_2026: body.estudiantes_2026 || 0,
      estudiantes_2027: body.estudiantes_2027 || 0,
    };
    agregarFila_(CONFIG.SHEETS.INSTITUCIONES, institucion);
    registrarLog_('createInstitucion', institucion);
    return institucion;
  },

  eliminar(body) {
    requireFields_(body, ['id']);
    eliminarFilaPorId_(CONFIG.SHEETS.INSTITUCIONES, body.id);
    registrarLog_('deleteInstitucion', { id: body.id });
    return { id: body.id, eliminado: true };
  },
};
