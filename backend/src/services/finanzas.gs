/**
 * FINANZAS: cada fila trae "tipo" (objetivo | fuente) para distinguir el
 * desglose por objetivo/componente del desglose por fuente de financiación,
 * ya que hoy no se cuenta con el cruce completo objetivo x fuente.
 */

const FinanzasService = {
  listar() {
    const filas = leerHojaComoObjetos_(CONFIG.SHEETS.FINANZAS);
    const talentoHumano = leerHojaComoObjetos_(CONFIG.SHEETS.TALENTO_HUMANO);
    return {
      por_objetivo: filas.filter(f => f.tipo === 'objetivo'),
      por_fuente: filas.filter(f => f.tipo === 'fuente'),
      talento_humano: talentoHumano,
    };
  },

  /** Cubre tanto filas "objetivo" como "fuente": ambas viven en la misma hoja FINANZAS con id propio. */
  actualizar(body) {
    requireFields_(body, ['id', 'cambios']);
    actualizarFilaPorId_(CONFIG.SHEETS.FINANZAS, body.id, body.cambios);
    registrarLog_('updateFinanza', { id: body.id, cambios: body.cambios });
    return buscarPorId_(CONFIG.SHEETS.FINANZAS, body.id);
  },
};
