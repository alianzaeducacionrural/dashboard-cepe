/**
 * Motor de alertas automáticas (spec sección 9) + persistencia de alertas
 * manuales y de resoluciones sobre alertas automáticas.
 *
 * Diseño: las alertas automáticas (retraso_producto, indicador_sin_medir,
 * desviacion_financiera, producto_proximo_vencer) NO se guardan en la hoja
 * ALERTAS; se recalculan en cada lectura a partir de PRODUCTOS/MEL/OBJETIVOS,
 * con un id determinístico ("AUTO-<tipo>-<referencia>"). Esto evita que
 * queden alertas obsoletas si el dato de origen cambia.
 *
 * La hoja ALERTAS solo guarda:
 *   (a) alertas manuales (creadas vía createAlerta, tipo libre p.ej. "otro"), y
 *   (b) resoluciones de alertas automáticas (una fila con el mismo id "AUTO-..."
 *       y estado "resuelta", que se usa para "apagar" esa alerta hasta que
 *       la condición que la originó cambie).
 */

function generarAlertasAutomaticas_() {
  const mesActual = CONFIG.MES_ACTUAL;
  const out = [];

  const productos = ProductosService.listar();
  productos.forEach(p => {
    if (mesActual >= p.mes_inicio && p.pct_real < 100) {
      if (p.pct_real < p.pct_esperado * 0.5) {
        out.push({
          id: 'AUTO-retraso_producto-' + p.id, tipo: 'retraso_producto', severidad: 'alta',
          descripcion: 'Producto "' + p.nombre + '" con avance real ' + p.pct_real + '% muy por debajo del esperado (' + p.pct_esperado + '%).',
          producto_id: p.id, indicador_id: '', fecha: CONFIG.FECHA_CORTE, estado: 'activa',
          accion: 'Priorizar seguimiento y definir plan de choque con el responsable.',
        });
      } else if (p.pct_real < p.pct_esperado * 0.85) {
        out.push({
          id: 'AUTO-retraso_producto_media-' + p.id, tipo: 'retraso_producto', severidad: 'media',
          descripcion: 'Producto "' + p.nombre + '" con avance real ' + p.pct_real + '% ligeramente por debajo del esperado (' + p.pct_esperado + '%).',
          producto_id: p.id, indicador_id: '', fecha: CONFIG.FECHA_CORTE, estado: 'activa',
          accion: 'Monitorear evolución en el próximo corte mensual.',
        });
      }
    }
    if (mesActual === p.mes_fin && p.pct_real < 100) {
      out.push({
        id: 'AUTO-producto_proximo_vencer-' + p.id, tipo: 'producto_proximo_vencer', severidad: 'media',
        descripcion: 'Producto "' + p.nombre + '" llega a su mes de cierre (mes ' + p.mes_fin + ') con ' + p.pct_real + '% de avance.',
        producto_id: p.id, indicador_id: '', fecha: CONFIG.FECHA_CORTE, estado: 'activa',
        accion: 'Confirmar fecha de cierre real o ajustar cronograma.',
      });
    }
  });

  const indicadores = leerHojaComoObjetos_(CONFIG.SHEETS.INDICADORES_MEL);
  indicadores.forEach(m => {
    if (m.corresponde_medicion === true && m.se_midio === 'No') {
      out.push({
        id: 'AUTO-indicador_sin_medir-' + m.id, tipo: 'indicador_sin_medir', severidad: 'alta',
        descripcion: 'Indicador MEL "' + m.nombre + '" correspondía medición y no se realizó.',
        producto_id: '', indicador_id: m.id, fecha: CONFIG.FECHA_CORTE, estado: 'activa',
        accion: 'Coordinar con el equipo MEL la aplicación pendiente del instrumento.',
      });
    } else if (m.se_midio === 'Parcial') {
      out.push({
        id: 'AUTO-indicador_parcial-' + m.id, tipo: 'indicador_sin_medir', severidad: 'media',
        descripcion: 'Indicador MEL "' + m.nombre + '" con medición parcial. ' + (m.observaciones || ''),
        producto_id: '', indicador_id: m.id, fecha: CONFIG.FECHA_CORTE, estado: 'activa',
        accion: 'Completar la medición pendiente en el próximo corte.',
      });
    }
  });

  const objetivos = leerHojaComoObjetos_(CONFIG.SHEETS.OBJETIVOS);
  const sumaPresupuestado = objetivos.reduce((s, o) => s + Number(o.presupuestado || 0), 0);
  const sumaEjecutado = objetivos.reduce((s, o) => s + Number(o.ejecutado || 0), 0);
  const avanceFinancieroGlobal = sumaPresupuestado ? (sumaEjecutado / sumaPresupuestado) * 100 : 0;
  const avanceTecnicoGlobal = sumaPresupuestado
    ? objetivos.reduce((s, o) => {
        const prods = productos.filter(p => p.objetivo_id === o.id);
        const avanceObjetivo = prods.reduce((s2, p) => s2 + p.pct_real * (p.peso / 100), 0);
        return s + avanceObjetivo * (Number(o.presupuestado || 0) / sumaPresupuestado);
      }, 0)
    : 0;
  if (avanceFinancieroGlobal - avanceTecnicoGlobal > 20) {
    out.push({
      id: 'AUTO-desviacion_financiera-GLOBAL', tipo: 'desviacion_financiera', severidad: 'media',
      descripcion: 'La ejecución financiera (' + avanceFinancieroGlobal.toFixed(1) + '%) supera el avance técnico (' + avanceTecnicoGlobal.toFixed(1) + '%) en ' + (avanceFinancieroGlobal - avanceTecnicoGlobal).toFixed(1) + ' puntos porcentuales.',
      producto_id: '', indicador_id: '', fecha: CONFIG.FECHA_CORTE, estado: 'activa',
      accion: 'Validar con el área financiera la causa de la brecha.',
    });
  }

  return out;
}

function obtenerAlertas_() {
  const automaticas = generarAlertasAutomaticas_();
  const guardadas = leerHojaComoObjetos_(CONFIG.SHEETS.ALERTAS);

  const resoluciones = {};
  guardadas.filter(g => String(g.id).indexOf('AUTO-') === 0).forEach(g => { resoluciones[g.id] = g.estado; });

  const automaticasConEstado = automaticas.map(a => (
    resoluciones[a.id] ? Object.assign({}, a, { estado: resoluciones[a.id] }) : a
  ));
  const manuales = guardadas.filter(g => String(g.id).indexOf('AUTO-') !== 0);

  const orden = { alta: 0, media: 1, baja: 2 };
  return automaticasConEstado.concat(manuales).sort((a, b) => orden[a.severidad] - orden[b.severidad]);
}
