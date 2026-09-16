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
 * % de avance = promedio SOLO sobre los meses efectivamente programados (no sobre
 * todo el tramo mes_inicio–mes_fin, que puede tener huecos). Cada mes programado
 * suma 'realizado' (1), 'en_proceso' (0.5), o 'no_iniciado'/'atrasado' (0).
 * 'atrasado' no suma avance — es una marca visual para llamar la atención sobre
 * un mes programado y vencido sin ejecutar, distinta de 'no_iniciado' (aún no le
 * correspondía empezar). Compatibilidad: la clave antigua 'ejecutado' suma igual
 * que 'realizado'.
 */
function calcularPctPorMeses_(estadosJson) {
  const estados = parsearEstadosMensuales_(estadosJson);
  const meses = Object.keys(estados);
  if (!meses.length) return 0;
  let suma = 0;
  meses.forEach(function (m) {
    const estado = estados[m];
    if (estado === 'realizado' || estado === 'ejecutado') suma += 1;
    else if (estado === 'en_proceso') suma += 0.5;
  });
  return Math.round((suma / meses.length) * 1000) / 10;
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
 * (alcanzado/meta) o 'mensual' (estados marcados mes a mes).
 */
function computarProducto_(producto, mesActual, actividadesDelProducto) {
  let mesInicio = Number(producto.mes_inicio);
  let mesFin = Number(producto.mes_fin);
  const tipoMedicion = producto.tipo_medicion || 'manual';
  let pctReal;
  if (tipoMedicion === 'meta') {
    const meta = Number(producto.meta) || 0;
    const alcanzado = Number(producto.alcanzado) || 0;
    pctReal = meta > 0 ? Math.round((alcanzado / meta) * 1000) / 10 : 0;
  } else if (tipoMedicion === 'mensual') {
    const programados = mesesProgramados_(producto.estados_mensuales);
    if (programados.length) { mesInicio = programados[0]; mesFin = programados[programados.length - 1]; }
    pctReal = calcularPctPorMeses_(producto.estados_mensuales);
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
 *   - 'mensual': estados marcados mes a mes (igual que en productos).
 * Esta distinción le importa sobre todo a quien carga datos en el panel
 * admin; en las vistas públicas todas se ven igual (barra + estado).
 */
function computarActividad_(actividad, mesActual) {
  let mesInicio = Number(actividad.mes_inicio) || 1;
  let mesFin = Number(actividad.mes_fin) || mesInicio;
  const meta = Number(actividad.meta) || 0;
  const alcanzado = Number(actividad.alcanzado) || 0;
  const tipoMedicion = actividad.tipo_medicion || (meta > 0 ? 'meta' : 'simple');
  let pctAvance;
  if (tipoMedicion === 'meta') {
    pctAvance = meta > 0 ? Math.round((alcanzado / meta) * 1000) / 10 : 0;
  } else if (tipoMedicion === 'mensual') {
    const programados = mesesProgramados_(actividad.estados_mensuales);
    if (programados.length) { mesInicio = programados[0]; mesFin = programados[programados.length - 1]; }
    pctAvance = calcularPctPorMeses_(actividad.estados_mensuales);
  } else {
    pctAvance = actividad.completada === true ? 100 : 0;
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
