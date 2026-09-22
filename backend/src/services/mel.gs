/**
 * Indicadores MEL, alineados a la matriz de seguimiento MEL oficial (columnas
 * objetivo, tipo, periodicidad, meta, línea base, avance por trimestre) en vez
 * del esquema anterior más simple (¿corresponde medición? / ¿se midió?). El %
 * de avance y el semáforo se calculan en computarMel_ (rules/semaforos.gs).
 */
const MelService = {
  listar() {
    return computarMels_(leerHojaComoObjetos_(CONFIG.SHEETS.INDICADORES_MEL), CONFIG.MES_ACTUAL);
  },

  actualizar(body) {
    requireFields_(body, ['id', 'cambios']);
    actualizarFilaPorId_(CONFIG.SHEETS.INDICADORES_MEL, body.id, body.cambios);
    registrarLog_('updateMEL', { id: body.id, cambios: body.cambios });
    return computarMel_(buscarPorId_(CONFIG.SHEETS.INDICADORES_MEL, body.id), CONFIG.MES_ACTUAL);
  },

  crear(body) {
    requireFields_(body, ['nombre']);
    const indicador = {
      id: body.id || generarId_('MEL'),
      objetivo_id: body.objetivo_id || '',
      nombre: body.nombre,
      tipo: body.tipo || 'Producto',
      periodicidad: body.periodicidad || '',
      meta: body.meta || 0,
      linea_base: body.linea_base || '',
      avance_q1: body.avance_q1 || 0,
      avance_q2: body.avance_q2 || 0,
      avance_q3: body.avance_q3 || 0,
      avance_q4: body.avance_q4 || 0,
      observaciones: body.observaciones || '',
    };
    agregarFila_(CONFIG.SHEETS.INDICADORES_MEL, indicador);
    registrarLog_('createMEL', indicador);
    return computarMel_(indicador, CONFIG.MES_ACTUAL);
  },

  eliminar(body) {
    requireFields_(body, ['id']);
    eliminarFilaPorId_(CONFIG.SHEETS.INDICADORES_MEL, body.id);
    registrarLog_('deleteMEL', { id: body.id });
    return { id: body.id, eliminado: true };
  },
};
