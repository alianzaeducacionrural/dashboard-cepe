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
 * % de avance a partir de estados mensuales marcados a mano (admin), uno de
 * 'ejecutado' (1), 'en_proceso' (0.5) o 'no_ejecutado'/ausente (0), por cada
 * mes dentro de [mesInicio, mesFin]. `estadosJson` es el JSON string guardado
 * en la columna estados_mensuales (p. ej. {"3":"ejecutado","4":"en_proceso"}).
 */
function calcularPctPorMeses_(estadosJson, mesInicio, mesFin) {
  let estados = {};
  try { estados = estadosJson ? JSON.parse(estadosJson) : {}; } catch (e) { estados = {}; }
  const total = mesFin - mesInicio + 1;
  if (total <= 0) return 0;
  let suma = 0;
  for (let m = mesInicio; m <= mesFin; m++) {
    const estado = estados[m] || estados[String(m)];
    if (estado === 'ejecutado') suma += 1;
    else if (estado === 'en_proceso') suma += 0.5;
  }
  return Math.round((suma / total) * 1000) / 10;
}

function parsearEstadosMensuales_(estadosJson) {
  try { return estadosJson ? JSON.parse(estadosJson) : {}; } catch (e) { return {}; }
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
    pctReal = calcularPctPorMeses_(producto.estados_mensuales, mesInicio, mesFin);
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
  const mesInicio = Number(actividad.mes_inicio) || 1;
  const mesFin = Number(actividad.mes_fin) || mesInicio;
  const meta = Number(actividad.meta) || 0;
  const alcanzado = Number(actividad.alcanzado) || 0;
  const tipoMedicion = actividad.tipo_medicion || (meta > 0 ? 'meta' : 'simple');
  let pctAvance;
  if (tipoMedicion === 'meta') {
    pctAvance = meta > 0 ? Math.round((alcanzado / meta) * 1000) / 10 : 0;
  } else if (tipoMedicion === 'mensual') {
    pctAvance = calcularPctPorMeses_(actividad.estados_mensuales, mesInicio, mesFin);
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
