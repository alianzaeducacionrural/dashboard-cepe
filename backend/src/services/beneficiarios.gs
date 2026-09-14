/**
 * BENEFICIARIOS: aún no existe un listado individual de beneficiarios
 * (no fue provisto en los documentos fuente), por lo que la hoja
 * BENEFICIARIOS (esquema por persona, spec sección 7.5) queda lista pero
 * vacía para cuando se cargue el listado real. Mientras tanto, el resumen
 * agregado real (género, edad, deserción, etc. del Informe Técnico agosto
 * 2026) se sirve desde BENEFICIARIOS_RESUMEN.
 */

const BeneficiariosService = {
  listar() {
    const individuales = leerHojaComoObjetos_(CONFIG.SHEETS.BENEFICIARIOS);
    const resumenFilas = leerHojaComoObjetos_(CONFIG.SHEETS.BENEFICIARIOS_RESUMEN);
    const resumen = {};
    resumenFilas.forEach(f => { resumen[f.categoria] = { mujeres: f.mujeres, hombres: f.hombres }; });
    return { individuales: individuales, resumen: resumen };
  },

  /** BENEFICIARIOS_RESUMEN se identifica por "categoria" (estudiantes, docentes, ...), no por "id". */
  actualizar(body) {
    requireFields_(body, ['categoria', 'cambios']);
    actualizarFilaPorCampo_(CONFIG.SHEETS.BENEFICIARIOS_RESUMEN, 'categoria', body.categoria, body.cambios);
    registrarLog_('updateBeneficiarios', { categoria: body.categoria, cambios: body.cambios });
    return buscarPorCampo_(CONFIG.SHEETS.BENEFICIARIOS_RESUMEN, 'categoria', body.categoria);
  },
};
