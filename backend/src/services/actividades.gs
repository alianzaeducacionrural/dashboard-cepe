/**
 * Cada actividad tiene su propio rango de meses y % de avance, igual que un
 * producto (mismo motor de semáforo en rules/semaforos.gs), porque en la
 * práctica varios productos se ejecutan como 2-4 sub-actividades con su
 * propio ritmo (p. ej. "Canasta educativa" = bienestar + currículo base +
 * currículo específico + prácticas académicas).
 */
const ActividadesService = {
  listar() {
    return computarActividades_(leerHojaComoObjetos_(CONFIG.SHEETS.ACTIVIDADES), CONFIG.MES_ACTUAL);
  },

  /**
   * Acepta tres formas de cargar el avance (ver computarActividad_): pasa
   * `meta` + `alcanzado` (tipo_medicion 'meta'), `completada` true/false
   * (tipo_medicion 'simple'), o `estados_mensuales` (tipo_medicion 'mensual').
   */
  crear(body) {
    requireFields_(body, ['producto_id', 'nombre']);
    const actividad = {
      id: body.id || generarId_('ACT'),
      producto_id: body.producto_id,
      nombre: body.nombre,
      mes_inicio: body.mes_inicio || 1,
      mes_fin: body.mes_fin || body.mes_inicio || 1,
      tipo_medicion: body.tipo_medicion || (Number(body.meta) > 0 ? 'meta' : 'simple'),
      meta: body.meta || 0,
      alcanzado: body.alcanzado || 0,
      completada: !!body.completada,
      estados_mensuales: body.estados_mensuales || '',
      responsable: body.responsable || '',
      fecha_realizacion: body.fecha_realizacion || '',
      evidencia: body.evidencia || '',
      observaciones: body.observaciones || '',
    };
    agregarFila_(CONFIG.SHEETS.ACTIVIDADES, actividad);
    registrarLog_('createActividad', actividad);
    return computarActividad_(actividad, CONFIG.MES_ACTUAL);
  },

  actualizar(body) {
    requireFields_(body, ['id', 'cambios']);
    actualizarFilaPorId_(CONFIG.SHEETS.ACTIVIDADES, body.id, body.cambios);
    registrarLog_('updateActividad', { id: body.id, cambios: body.cambios });
    return computarActividad_(buscarPorId_(CONFIG.SHEETS.ACTIVIDADES, body.id), CONFIG.MES_ACTUAL);
  },

  eliminar(body) {
    requireFields_(body, ['id']);
    eliminarFilaPorId_(CONFIG.SHEETS.ACTIVIDADES, body.id);
    registrarLog_('deleteActividad', { id: body.id });
    return { id: body.id, eliminado: true };
  },
};
