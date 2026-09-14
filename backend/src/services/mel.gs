const MelService = {
  listar() {
    return leerHojaComoObjetos_(CONFIG.SHEETS.INDICADORES_MEL);
  },

  actualizar(body) {
    requireFields_(body, ['id', 'cambios']);
    actualizarFilaPorId_(CONFIG.SHEETS.INDICADORES_MEL, body.id, body.cambios);
    registrarLog_('updateMEL', { id: body.id, cambios: body.cambios });
    return buscarPorId_(CONFIG.SHEETS.INDICADORES_MEL, body.id);
  },

  crear(body) {
    requireFields_(body, ['nombre']);
    const indicador = {
      id: body.id || generarId_('MEL'),
      nombre: body.nombre,
      periodicidad: body.periodicidad || '',
      meta: body.meta || '',
      alcanzado: body.alcanzado || '',
      pct_cumplimiento: body.pct_cumplimiento || '',
      corresponde_medicion: body.corresponde_medicion !== undefined ? !!body.corresponde_medicion : true,
      se_midio: body.se_midio || 'No',
      observaciones: body.observaciones || '',
    };
    agregarFila_(CONFIG.SHEETS.INDICADORES_MEL, indicador);
    registrarLog_('createMEL', indicador);
    return indicador;
  },

  eliminar(body) {
    requireFields_(body, ['id']);
    eliminarFilaPorId_(CONFIG.SHEETS.INDICADORES_MEL, body.id);
    registrarLog_('deleteMEL', { id: body.id });
    return { id: body.id, eliminado: true };
  },
};
