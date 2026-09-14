const ProductosService = {
  listar() {
    const actividades = leerHojaComoObjetos_(CONFIG.SHEETS.ACTIVIDADES);
    return computarProductos_(leerHojaComoObjetos_(CONFIG.SHEETS.PRODUCTOS), CONFIG.MES_ACTUAL, actividades);
  },

  actualizar(body) {
    requireFields_(body, ['id', 'cambios']);
    actualizarFilaPorId_(CONFIG.SHEETS.PRODUCTOS, body.id, body.cambios);
    registrarLog_('updateProducto', { id: body.id, cambios: body.cambios });
    const actualizado = buscarPorId_(CONFIG.SHEETS.PRODUCTOS, body.id);
    const actividades = leerHojaComoObjetos_(CONFIG.SHEETS.ACTIVIDADES).filter(a => a.producto_id === body.id);
    return computarProducto_(actualizado, CONFIG.MES_ACTUAL, actividades);
  },

  crear(body) {
    requireFields_(body, ['objetivo_id', 'nombre']);
    const producto = {
      id: body.id || generarId_('PROD'),
      objetivo_id: body.objetivo_id,
      nombre: body.nombre,
      peso: body.peso || 0,
      mes_inicio: body.mes_inicio || 1,
      mes_fin: body.mes_fin || body.mes_inicio || 1,
      tipo_medicion: body.tipo_medicion || 'manual',
      pct_real: body.pct_real || 0,
      meta: body.meta || 0,
      alcanzado: body.alcanzado || 0,
      estados_mensuales: body.estados_mensuales || '',
      valor_ejecutado: body.valor_ejecutado || 0,
      responsable: body.responsable || '',
      observaciones: body.observaciones || '',
    };
    agregarFila_(CONFIG.SHEETS.PRODUCTOS, producto);
    registrarLog_('createProducto', producto);
    return computarProducto_(producto, CONFIG.MES_ACTUAL, []);
  },

  /** Borra el producto y, para no dejarlas huérfanas, también sus actividades hijas. */
  eliminar(body) {
    requireFields_(body, ['id']);
    const actividades = leerHojaComoObjetos_(CONFIG.SHEETS.ACTIVIDADES).filter(a => a.producto_id === body.id);
    actividades.forEach(a => eliminarFilaPorId_(CONFIG.SHEETS.ACTIVIDADES, a.id));
    eliminarFilaPorId_(CONFIG.SHEETS.PRODUCTOS, body.id);
    registrarLog_('deleteProducto', { id: body.id, actividadesEliminadas: actividades.map(a => a.id) });
    return { id: body.id, eliminado: true };
  },
};
