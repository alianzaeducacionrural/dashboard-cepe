/**
 * Reglas de semáforo por producto (spec sección 9).
 * Debe mantenerse en paralelo con el motor RULES del prototipo frontend
 * (index.html) hasta que el frontend consuma estos valores desde la API.
 */

function calcularPctEsperado_(mesInicio, mesFin, mesActual) {
  if (mesActual < mesInicio) return 0;
  if (mesActual >= mesFin) return 100;
  return Math.round(((mesActual - mesInicio + 1) / (mesFin - mesInicio + 1)) * 100);
}

function calcularColorSemaforo_(pctReal, pctEsperado, mesInicio, mesFin, mesActual) {
  if (pctReal >= 100) return 'azul';
  if (mesActual > mesFin && pctReal < 100) return 'rojo';
  if (mesActual < mesInicio) return 'gris';
  if (pctReal === 0) return 'gris';
  if (pctReal < pctEsperado * 0.5) return 'rojo';
  if (pctReal < pctEsperado * 0.85) return 'amarillo';
  if (pctReal >= pctEsperado) return 'verde';
  return 'amarillo';
}

const ESTADO_POR_COLOR = {
  azul: 'completado',
  verde: 'en_tiempo',
  amarillo: 'en_riesgo',
  rojo: 'retrasado',
  gris: 'no_iniciado',
};

/**
 * No todas las actividades se ejecutan en meses corridos — el plan de trabajo real
 * tiene productos programados por ejemplo en los meses 2,4,5,6,7,8,9 (sin el mes 3).
 * Por eso `estados_mensuales` es la única fuente de verdad de QUÉ meses están
 * programados (cada clave presente = programado; un mes sin clave = no programado,
 * así esté "en medio" de otros meses sí programados) — nunca se asume que todo el
 * tramo entre el primer y el último mes programado está activo.
 */
function parsearEstadosMensuales_(estadosJson) {
  try { return estadosJson ? JSON.parse(estadosJson) : {}; } catch (e) { return {}; }
}

/** Meses programados (claves de estados_mensuales), como números y ordenados. */
function mesesProgramados_(estadosJson) {
  return Object.keys(parsearEstadosMensuales_(estadosJson)).map(Number).sort(function (a, b) { return a - b; });
}

/**
 * Enriquece un producto crudo con pct_esperado, color y estado calculados.
 * Si el producto tiene actividades propias, su rango de meses y su % real
 * se DERIVAN de ellas (consolidado): mes_inicio/mes_fin = min/max de las
 * actividades, pct_real = promedio de su % de avance. Esto evita que el
 * valor guardado directamente en PRODUCTOS quede desincronizado de sus
 * actividades (como pasó con "Canasta educativa": 25% guardado vs. 52.2%
 * real de sus 4 actividades). Sin actividades, el % se calcula según su
 * propio tipo_medicion: 'manual' (pct_real tal cual, default), 'meta'
 * (alcanzado/meta).
 *
 * El Cronograma es independiente de cómo se mide el avance: `estados_mensuales`
 * (qué meses están programados y en qué estado, con huecos si es el caso) solo
 * define mes_inicio/mes_fin para el semáforo, sin importar el tipo_medicion, y
 * el % NUNCA se deriva de marcar celdas ahí. Editar el producto no toca el
 * Cronograma, y editar el Cronograma no toca el % ni el tipo de medición.
 */
function computarProducto_(producto, mesActual, actividadesDelProducto) {
  let mesInicio = Number(producto.mes_inicio);
  let mesFin = Number(producto.mes_fin);
  const programados = mesesProgramados_(producto.estados_mensuales);
  if (programados.length) { mesInicio = programados[0]; mesFin = programados[programados.length - 1]; }
  const tipoMedicion = producto.tipo_medicion || 'manual';
  let pctReal;
  if (tipoMedicion === 'meta') {
    const meta = Number(producto.meta) || 0;
    const alcanzado = Number(producto.alcanzado) || 0;
    pctReal = meta > 0 ? Math.round((alcanzado / meta) * 1000) / 10 : 0;
  } else {
    pctReal = Number(producto.pct_real) || 0;
  }

  if (actividadesDelProducto && actividadesDelProducto.length) {
    const computadas = computarActividades_(actividadesDelProducto, mesActual);
    mesInicio = Math.min.apply(null, computadas.map(a => a.mes_inicio));
    mesFin = Math.max.apply(null, computadas.map(a => a.mes_fin));
    pctReal = Math.round((computadas.reduce((s, a) => s + a.pct_avance, 0) / computadas.length) * 10) / 10;
  }

  const pctEsperado = calcularPctEsperado_(mesInicio, mesFin, mesActual);
  const color = calcularColorSemaforo_(pctReal, pctEsperado, mesInicio, mesFin, mesActual);
  return Object.assign({}, producto, {
    mes_inicio: mesInicio,
    mes_fin: mesFin,
    tipo_medicion: tipoMedicion,
    estados_mensuales: parsearEstadosMensuales_(producto.estados_mensuales),
    pct_real: pctReal,
    pct_esperado: pctEsperado,
    color: color,
    estado: ESTADO_POR_COLOR[color],
  });
}

/**
 * `actividades` es la lista completa (de todos los productos); se filtra aquí por producto_id.
 * El `peso` de cada producto se calcula automáticamente como partes iguales dentro de su
 * objetivo (100 / cantidad de productos de ese objetivo) — no se guarda a mano; cualquier
 * valor que traiga la hoja en esa columna se ignora y se sobrescribe aquí.
 */
function computarProductos_(productos, mesActual, actividades) {
  actividades = actividades || [];
  const conteoPorObjetivo = {};
  productos.forEach(p => { conteoPorObjetivo[p.objetivo_id] = (conteoPorObjetivo[p.objetivo_id] || 0) + 1; });
  return productos.map(p => {
    const cantidad = conteoPorObjetivo[p.objetivo_id] || 1;
    const peso = Math.round((100 / cantidad) * 10) / 10;
    return computarProducto_(Object.assign({}, p, { peso: peso }), mesActual, actividades.filter(a => a.producto_id === p.id));
  });
}

/**
 * Igual que computarProducto_, pero para una actividad. Soporta tres formas
 * de medir el avance (la elige quien carga el dato, según lo que tenga
 * sentido para esa actividad puntual). tipo_medicion es explícito desde la
 * hoja; si una fila vieja no lo trae, se infiere igual que antes (meta>0).
 *   - 'meta': meta + alcanzado -> % = alcanzado/meta (auditable, p. ej.
 *     "17 de 191 estudiantes").
 *   - 'simple' (sí/no): completada=true/false para actividades que no tienen
 *     una cantidad de por medio (p. ej. "Diseñar el protocolo"). % = 100 o 0.
 *   - 'manual': `pct_real` tal cual, un número reportado directamente.
 * Igual que en computarProducto_, el Cronograma (`estados_mensuales`) solo
 * define mes_inicio/mes_fin y es independiente del tipo de medición y del %.
 * Esta distinción le importa sobre todo a quien carga datos en el panel
 * admin; en las vistas públicas todas se ven igual (barra + estado).
 */
function computarActividad_(actividad, mesActual) {
  let mesInicio = Number(actividad.mes_inicio) || 1;
  let mesFin = Number(actividad.mes_fin) || mesInicio;
  const programados = mesesProgramados_(actividad.estados_mensuales);
  if (programados.length) { mesInicio = programados[0]; mesFin = programados[programados.length - 1]; }
  const meta = Number(actividad.meta) || 0;
  const alcanzado = Number(actividad.alcanzado) || 0;
  const tipoMedicion = actividad.tipo_medicion || (meta > 0 ? 'meta' : 'simple');
  let pctAvance;
  if (tipoMedicion === 'meta') {
    pctAvance = meta > 0 ? Math.round((alcanzado / meta) * 1000) / 10 : 0;
  } else if (tipoMedicion === 'simple') {
    pctAvance = actividad.completada === true ? 100 : 0;
  } else {
    pctAvance = Number(actividad.pct_real) || 0;
  }
  const pctEsperado = calcularPctEsperado_(mesInicio, mesFin, mesActual);
  const color = calcularColorSemaforo_(pctAvance, pctEsperado, mesInicio, mesFin, mesActual);
  return Object.assign({}, actividad, {
    mes_inicio: mesInicio,
    mes_fin: mesFin,
    meta: meta,
    alcanzado: alcanzado,
    completada: actividad.completada === true,
    tipo_medicion: tipoMedicion,
    estados_mensuales: parsearEstadosMensuales_(actividad.estados_mensuales),
    pct_avance: pctAvance,
    pct_esperado: pctEsperado,
    color: color,
    estado: ESTADO_POR_COLOR[color],
  });
}

function computarActividades_(actividades, mesActual) {
  return actividades.map(a => computarActividad_(a, mesActual));
}

/**
 * Indicadores MEL: avance real reportado trimestre a trimestre (avance_q1..q4,
 * cada uno el % de la meta logrado en ese trimestre — vienen así de la matriz
 * de seguimiento MEL oficial), en vez de un simple "se midió sí/no". El % total
 * es la suma de los 4 trimestres. Para el semáforo se reutiliza el mismo motor
 * que productos (calcularPctEsperado_/calcularColorSemaforo_), tratando el año
 * como un rango de 4 "meses" (trimestres) — el mismo indicador puede estar
 * verde en enero (aún no le tocaba) y rojo en octubre (debía tener más avance).
 */
function computarMel_(indicador, mesActual) {
  // mesActual usa la numeración del proyecto (Mar=1...Nov=9); los trimestres del
  // Q1-Q4 de la matriz MEL son de calendario (Q1 ene-mar, Q3 jul-sep...), así que
  // se convierte primero al mes calendario real (Mar=3) antes de sacar el trimestre.
  const mesCalendario = mesActual + 2;
  const trimestreActual = Math.min(4, Math.max(1, Math.ceil(mesCalendario / 3)));
  const q1 = Number(indicador.avance_q1) || 0;
  const q2 = Number(indicador.avance_q2) || 0;
  const q3 = Number(indicador.avance_q3) || 0;
  const q4 = Number(indicador.avance_q4) || 0;
  const pctAvance = Math.round((q1 + q2 + q3 + q4) * 10) / 10;
  const pctEsperado = calcularPctEsperado_(1, 4, trimestreActual);
  const color = calcularColorSemaforo_(pctAvance, pctEsperado, 1, 4, trimestreActual);
  return Object.assign({}, indicador, {
    tipo: indicador.tipo || 'Producto',
    meta: Number(indicador.meta) || 0,
    avance_q1: q1, avance_q2: q2, avance_q3: q3, avance_q4: q4,
    pct_avance: pctAvance,
    pct_esperado: pctEsperado,
    trimestre_actual: trimestreActual,
    color: color,
    estado: ESTADO_POR_COLOR[color],
  });
}

function computarMels_(indicadores, mesActual) {
  return indicadores.map(m => computarMel_(m, mesActual));
}
