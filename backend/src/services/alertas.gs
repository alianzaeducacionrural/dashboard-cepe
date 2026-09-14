const AlertasService = {
  listar() {
    return obtenerAlertas_();
  },

  crear(body) {
    requireFields_(body, ['tipo', 'severidad', 'descripcion']);
    const alerta = {
      id: generarId_('AL'),
      tipo: body.tipo,
      severidad: body.severidad,
      descripcion: body.descripcion,
      producto_id: body.producto_id || '',
      indicador_id: body.indicador_id || '',
      fecha: body.fecha || nowIso_().slice(0, 10),
      estado: 'activa',
      accion: body.accion || '',
    };
    agregarFila_(CONFIG.SHEETS.ALERTAS, alerta);
    registrarLog_('createAlerta', alerta);
    return alerta;
  },

  resolver(body) {
    requireFields_(body, ['id']);
    if (String(body.id).indexOf('AUTO-') === 0) {
      // Alerta automática: se guarda una fila de "resolución" con ese mismo id.
      const existente = buscarPorId_(CONFIG.SHEETS.ALERTAS, body.id);
      if (existente) {
        actualizarFilaPorId_(CONFIG.SHEETS.ALERTAS, body.id, { estado: 'resuelta' });
      } else {
        agregarFila_(CONFIG.SHEETS.ALERTAS, {
          id: body.id, tipo: '', severidad: '', descripcion: '(resolución de alerta automática)',
          producto_id: '', indicador_id: '', fecha: nowIso_().slice(0, 10), estado: 'resuelta', accion: '',
        });
      }
    } else {
      actualizarFilaPorId_(CONFIG.SHEETS.ALERTAS, body.id, { estado: 'resuelta' });
    }
    registrarLog_('resolveAlerta', { id: body.id });
    return { id: body.id, estado: 'resuelta' };
  },
};
