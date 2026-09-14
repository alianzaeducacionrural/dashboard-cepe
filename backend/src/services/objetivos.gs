/**
 * OBJETIVOS: presupuesto/ejecución se guardan en la hoja; el avance técnico
 * y el estado se calculan a partir de PRODUCTOS (fuente única de verdad),
 * igual que en el motor RULES del prototipo frontend.
 */

const ObjetivosService = {
  listar() {
    const objetivos = leerHojaComoObjetos_(CONFIG.SHEETS.OBJETIVOS);
    const productos = ProductosService.listar();
    return objetivos.map(o => {
      const propios = productos.filter(p => p.objetivo_id === o.id);
      const avance_actual = propios.reduce((s, p) => s + p.pct_real * (p.peso / 100), 0);
      return Object.assign({}, o, {
        avance_actual: Math.round(avance_actual * 10) / 10,
        pct_ejecucion_financiera: o.presupuestado ? Math.round((o.ejecutado / o.presupuestado) * 1000) / 10 : null,
      });
    });
  },

  actualizar(body) {
    requireFields_(body, ['id', 'cambios']);
    actualizarFilaPorId_(CONFIG.SHEETS.OBJETIVOS, body.id, body.cambios);
    registrarLog_('updateObjetivo', { id: body.id, cambios: body.cambios });
    return buscarPorId_(CONFIG.SHEETS.OBJETIVOS, body.id);
  },
};
