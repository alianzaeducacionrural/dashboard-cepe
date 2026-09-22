/**
 * Inicialización de una sola vez. Desde el editor de Apps Script (script.google.com),
 * selecciona la función `inicializar` en el desplegable y presiona "Ejecutar".
 * Crea las 11 hojas con encabezados y siembra los datos reales de corte agosto 2026
 * (los mismos usados en el prototipo frontend index.html), para no arrancar con
 * hojas vacías. Es seguro volver a ejecutar `crearHojas`: no borra hojas existentes.
 */

function inicializar() {
  crearHojas();
  sembrarDatosReales();
  configurarPropiedadesIniciales();
  Logger.log('Listo. Hojas creadas y datos reales cargados. Contraseña admin configurada.');
}

function crearHojas() {
  asegurarHojaConEncabezados_(CONFIG.SHEETS.OBJETIVOS, ['id', 'nombre', 'descripcion', 'presupuestado', 'ejecutado', 'orden']);
  asegurarHojaConEncabezados_(CONFIG.SHEETS.PRODUCTOS, ['id', 'objetivo_id', 'nombre', 'peso', 'mes_inicio', 'mes_fin', 'tipo_medicion', 'pct_real', 'meta', 'alcanzado', 'estados_mensuales', 'valor_ejecutado', 'responsable', 'observaciones']);
  asegurarHojaConEncabezados_(CONFIG.SHEETS.ACTIVIDADES, ['id', 'producto_id', 'nombre', 'mes_inicio', 'mes_fin', 'tipo_medicion', 'meta', 'alcanzado', 'completada', 'estados_mensuales', 'responsable', 'fecha_realizacion', 'evidencia', 'observaciones']);
  asegurarHojaConEncabezados_(CONFIG.SHEETS.INDICADORES_MEL, ['id', 'objetivo_id', 'nombre', 'tipo', 'periodicidad', 'meta', 'linea_base', 'avance_q1', 'avance_q2', 'avance_q3', 'avance_q4', 'observaciones']);
  asegurarHojaConEncabezados_(CONFIG.SHEETS.BENEFICIARIOS, ['id', 'tipo', 'genero', 'institucion', 'universidad', 'programa', 'estado', 'anio']);
  asegurarHojaConEncabezados_(CONFIG.SHEETS.BENEFICIARIOS_RESUMEN, ['categoria', 'mujeres', 'hombres']);
  asegurarHojaConEncabezados_(CONFIG.SHEETS.INSTITUCIONES, ['id', 'nombre', 'sede', 'estudiantes_2026', 'estudiantes_2027']);
  asegurarHojaConEncabezados_(CONFIG.SHEETS.FINANZAS, ['id', 'tipo', 'objetivo_id', 'label', 'presupuestado', 'ejecutado', 'fuente', 'detalle']);
  asegurarHojaConEncabezados_(CONFIG.SHEETS.TALENTO_HUMANO, ['id', 'rol', 'valor_mes', 'meses', 'dedicacion', 'pct_ejecutado', 'valor_ejecutado']);
  asegurarHojaConEncabezados_(CONFIG.SHEETS.ALERTAS, ['id', 'tipo', 'severidad', 'descripcion', 'producto_id', 'indicador_id', 'fecha', 'estado', 'accion']);
  asegurarHojaConEncabezados_(CONFIG.SHEETS.LOGS, ['timestamp', 'accion', 'usuario_rol', 'detalle']);
  asegurarHojaConEncabezados_(CONFIG.SHEETS.INFO_ADICIONAL, ['id', 'territorial', 'estado_general', 'estado_mel', 'desercion_cantidad', 'desercion_base', 'universidades', 'meta_directos_meta', 'meta_directos_alcanzado', 'meta_indirectos_meta', 'meta_indirectos_alcanzado']);
}

/**
 * La contraseña real NO se guarda en el código fuente (este repo es público en GitHub).
 * Si todavía no hay una configurada, deja una nota en el log; para fijarla, ejecuta
 * `establecerPasswordAdmin('tu-contraseña')` una sola vez desde el editor de Apps
 * Script (script.google.com) — nunca la escribas aquí ni la subas a git.
 */
function configurarPropiedadesIniciales() {
  if (!PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD')) {
    Logger.log('ADMIN_PASSWORD no está configurada. Ejecuta establecerPasswordAdmin("tu-contraseña") una sola vez desde el editor de Apps Script.');
  }
}

/** Ejecutar UNA VEZ desde el editor de Apps Script (no desde clasp/git) para fijar o cambiar la contraseña real. */
function establecerPasswordAdmin(password) {
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', password);
  Logger.log('Contraseña de administrador actualizada.');
}

function sembrarDatosReales() {
  sembrarSiVacia_(CONFIG.SHEETS.OBJETIVOS, [
    { id: 'OBJ1', nombre: 'Liderazgo directivo y triada Familia-Escuela-Estudiante', descripcion: 'Fortalecer las capacidades de liderazgo de los directivos docentes mediante programas de formación y acompañamiento en gestión educativa, orientados a la articulación efectiva de la triada familia–escuela–estudiante.', presupuestado: 12000000, ejecutado: 18191800, orden: 1 },
    { id: 'OBJ2', nombre: 'Articulación educación media – posmedia', descripcion: 'Mejorar el modelo de articulación institucional entre la educación media y la posmedia unificando planes de estudio, procesos de gestión y mecanismos de seguimiento.', presupuestado: 942980591, ejecutado: 741053045, orden: 2 },
    { id: 'OBJ3', nombre: 'Formación docente en el modelo Escuela Nueva', descripcion: 'Fortalecer la formación docente en la articulación del modelo Escuela Nueva en los niveles de media y posmedia.', presupuestado: 31880330, ejecutado: 7970085, orden: 3 },
  ]);

  sembrarSiVacia_(CONFIG.SHEETS.PRODUCTOS, [
    { id: 'P1.1', objetivo_id: 'OBJ1', nombre: 'Propuesta de formación por microcredenciales', peso: 25, mes_inicio: 1, mes_fin: 4, tipo_medicion: 'manual', pct_real: 100, valor_ejecutado: 12000000, responsable: 'Comité de Cafeteros de Caldas', observaciones: '100% ejecutado. Diseño de la microcertificación "Liderazgo Educativo, Emociones y Corresponsabilidad Territorial".' },
    { id: 'P1.2', objetivo_id: 'OBJ1', nombre: 'Directivos docentes participantes en microcredenciales', peso: 25, mes_inicio: 3, mes_fin: 8, tipo_medicion: 'manual', pct_real: 66.7, valor_ejecutado: 1083333, responsable: 'Comité de Cafeteros de Caldas', observaciones: 'Encuentro 4 de 6 realizado; asistencia superior al 92% de los 13 rectores convocados.' },
    { id: 'P1.3', objetivo_id: 'OBJ1', nombre: 'Mesas permanentes de diálogo familia-escuela-estudiante', peso: 25, mes_inicio: 2, mes_fin: 9, tipo_medicion: 'manual', pct_real: 100, valor_ejecutado: 0, responsable: 'Comité de Cafeteros de Caldas', observaciones: '8 mesas en total; instaladas en el 100% de las instituciones educativas vinculadas.' },
    { id: 'P1.4', objetivo_id: 'OBJ1', nombre: 'Esquema de acompañamiento entre pares (rectores)', peso: 25, mes_inicio: 7, mes_fin: 9, tipo_medicion: 'manual', pct_real: 0, valor_ejecutado: 0, responsable: 'Comité de Cafeteros de Caldas', observaciones: 'Modelo metodológico y protocolos diseñados; 4 visitas programadas para octubre y noviembre.' },
    { id: 'P2.1', objetivo_id: 'OBJ2', nombre: 'Mallas curriculares de articulación para programas técnicos', peso: 9.1, mes_inicio: 1, mes_fin: 2, tipo_medicion: 'manual', pct_real: 100, valor_ejecutado: 6437889, responsable: 'Comité de Cafeteros de Caldas', observaciones: '100% ejecutado.' },
    { id: 'P2.2', objetivo_id: 'OBJ2', nombre: 'Protocolo de articulación institucional media-posmedia', peso: 9.1, mes_inicio: 2, mes_fin: 5, tipo_medicion: 'manual', pct_real: 100, valor_ejecutado: 1609472, responsable: 'Comité de Cafeteros de Caldas', observaciones: 'Diseñado y validado técnicamente; pendiente evidencia de socialización.' },
    { id: 'P2.3', objetivo_id: 'OBJ2', nombre: 'Estudiantes matriculados en programas técnicos', peso: 9.1, mes_inicio: 1, mes_fin: 2, tipo_medicion: 'manual', pct_real: 100, valor_ejecutado: 539695938, responsable: 'Comité de Cafeteros de Caldas', observaciones: '191 estudiantes focalizados y matriculados en U. Autónoma, U. de Caldas, U. de Manizales y U. Católica.' },
    { id: 'P2.4', objetivo_id: 'OBJ2', nombre: 'Canasta educativa (bienestar y currículo base)', peso: 9.1, mes_inicio: 2, mes_fin: 8, tipo_medicion: 'manual', pct_real: 52.2, valor_ejecutado: 98643856, responsable: 'Comité de Cafeteros de Caldas', observaciones: 'Se compone de 4 actividades: bienestar universitario y currículo base al 100%; currículo específico sin iniciar; prácticas académicas iniciando (17 de 191 estudiantes).' },
    { id: 'P2.5', objetivo_id: 'OBJ2', nombre: 'Asesoría y acompañamiento a estudiantes (permanencia y rendimiento)', peso: 9.1, mes_inicio: 2, mes_fin: 9, tipo_medicion: 'manual', pct_real: 99.7, valor_ejecutado: 36423907, responsable: 'Comité de Cafeteros de Caldas', observaciones: '4 visitas realizadas; cobertura entre 149 y 191 estudiantes por visita.' },
    { id: 'P2.6', objetivo_id: 'OBJ2', nombre: 'Mallas curriculares para nuevos programas técnicos ofertados', peso: 9.1, mes_inicio: 1, mes_fin: 5, tipo_medicion: 'manual', pct_real: 100, valor_ejecutado: 9230769, responsable: 'Comité de Cafeteros de Caldas', observaciones: '3 mallas articuladas: Programación de Computadores, Mantenimiento Mecánico y Control Industrial (UAM).' },
    { id: 'P2.7', objetivo_id: 'OBJ2', nombre: 'Herramienta digital de seguimiento a egresados', peso: 9.1, mes_inicio: 1, mes_fin: 9, tipo_medicion: 'manual', pct_real: 66.7, valor_ejecutado: 5000000, responsable: 'Comité de Cafeteros de Caldas', observaciones: '50% de avance en el diseño; desarrollo en React + Vite + TypeScript, Supabase y Vercel.' },
    { id: 'P2.8', objetivo_id: 'OBJ2', nombre: 'Evaluación externa de competencias (prueba entrada/salida)', peso: 9.1, mes_inicio: 2, mes_fin: 8, tipo_medicion: 'manual', pct_real: 50, valor_ejecutado: 6685000, responsable: 'Comité de Cafeteros de Caldas', observaciones: 'Aplicada a 190 estudiantes; 1 estudiante de la IE La Cabaña pendiente por motivos de salud.' },
    { id: 'P2.9', objetivo_id: 'OBJ2', nombre: 'Recomendaciones de Comités Académicos implementadas', peso: 9.1, mes_inicio: 6, mes_fin: 9, tipo_medicion: 'manual', pct_real: 75, valor_ejecutado: '', responsable: 'Comité de Cafeteros de Caldas', observaciones: '1 Comité Académico realizado; seguimiento a sugerencias en curso.' },
    { id: 'P2.10', objetivo_id: 'OBJ2', nombre: 'Acudientes vinculados a espacios universitarios ("Familia a la U")', peso: 9.1, mes_inicio: 7, mes_fin: 8, tipo_medicion: 'manual', pct_real: 0, valor_ejecutado: '', responsable: 'Comité de Cafeteros de Caldas', observaciones: 'Estrategia incorporada; encuentros programados para septiembre-octubre.' },
    { id: 'P2.11', objetivo_id: 'OBJ2', nombre: 'Mobiliario colaborativo entregado a instituciones educativas', peso: 9.1, mes_inicio: 6, mes_fin: 8, tipo_medicion: 'manual', pct_real: 0, valor_ejecutado: '', responsable: 'Comité de Cafeteros de Caldas', observaciones: 'Actividad incorporada para adecuar espacios de aprendizaje al modelo Escuela Nueva.' },
    { id: 'P3.1', objetivo_id: 'OBJ3', nombre: 'Docentes universitarios capacitados en el modelo Escuela Nueva', peso: 50, mes_inicio: 2, mes_fin: 8, tipo_medicion: 'manual', pct_real: 47.4, valor_ejecutado: 5136277, responsable: 'Comité de Cafeteros de Caldas', observaciones: '45 docentes universitarios capacitados; talleres 2 y 3 (materiales, rutas de atención integral) en curso.' },
    { id: 'P3.2', objetivo_id: 'OBJ3', nombre: 'Docentes capacitados en prácticas pedagógicas y nuevas metodologías', peso: 50, mes_inicio: 7, mes_fin: 9, tipo_medicion: 'manual', pct_real: 0, valor_ejecutado: 0, responsable: 'Comité de Cafeteros de Caldas', observaciones: 'Formación programada para septiembre.' },
  ]);

  sembrarSiVacia_(CONFIG.SHEETS.ACTIVIDADES, [
    { id: 'ACT1', producto_id: 'P2.4', nombre: 'Bienestar universitario', mes_inicio: 2, mes_fin: 5, tipo_medicion: 'meta', meta: 191, alcanzado: 191, completada: false, responsable: 'Comité de Cafeteros de Caldas', fecha_realizacion: '', evidencia: 'Listado de asistencia a jornadas de bienestar universitario.', observaciones: '100% de los 191 estudiantes participaron en las jornadas de bienestar.' },
    { id: 'ACT2', producto_id: 'P2.4', nombre: 'Entrega de currículo base', mes_inicio: 3, mes_fin: 6, tipo_medicion: 'meta', meta: 191, alcanzado: 191, completada: false, responsable: 'Comité de Cafeteros de Caldas', fecha_realizacion: '', evidencia: 'Actas de entrega de dotación de currículo base.', observaciones: '191 de 191 estudiantes recibieron el kit de currículo base (100%).' },
    { id: 'ACT3', producto_id: 'P2.4', nombre: 'Entrega de currículo específico', mes_inicio: 6, mes_fin: 8, tipo_medicion: 'meta', meta: 191, alcanzado: 0, completada: false, responsable: 'Comité de Cafeteros de Caldas', fecha_realizacion: '', evidencia: 'Actas de entrega de dotación de currículo específico (pendiente).', observaciones: 'Sin iniciar entrega de kits de currículo específico.' },
    { id: 'ACT4', producto_id: 'P2.4', nombre: 'Prácticas académicas', mes_inicio: 2, mes_fin: 9, tipo_medicion: 'meta', meta: 191, alcanzado: 17, completada: false, responsable: 'Comité de Cafeteros de Caldas', fecha_realizacion: '', evidencia: 'Informes de prácticas académicas por institución.', observaciones: '17 de 191 estudiantes han iniciado práctica académica (IE Granada).' },
    { id: 'ACT5', producto_id: 'P3.1', nombre: 'Taller 1: Fundamentos del modelo Escuela Nueva', mes_inicio: 2, mes_fin: 5, tipo_medicion: 'meta', meta: 45, alcanzado: 45, completada: false, responsable: 'Comité de Cafeteros de Caldas', fecha_realizacion: '', evidencia: 'Listado de docentes capacitados; informe de formación.', observaciones: '45 de 45 docentes universitarios capacitados (100%).' },
    { id: 'ACT6', producto_id: 'P3.1', nombre: 'Taller 2: Manejo de materiales y guías de interaprendizaje', mes_inicio: 6, mes_fin: 7, tipo_medicion: 'meta', meta: 45, alcanzado: 19, completada: false, responsable: 'Comité de Cafeteros de Caldas', fecha_realizacion: '', evidencia: 'Listado de docentes capacitados; informe de formación.', observaciones: '19 de 45 docentes capacitados (42%).' },
    { id: 'ACT7', producto_id: 'P3.1', nombre: 'Taller 3: Ruta de atención integral y articulación con el sector productivo', mes_inicio: 7, mes_fin: 8, tipo_medicion: 'meta', meta: 45, alcanzado: 0, completada: false, responsable: 'Comité de Cafeteros de Caldas', fecha_realizacion: '', evidencia: 'Listado de docentes capacitados; informe de formación.', observaciones: 'Sin iniciar.' },
  ]);

  // Tomado de la matriz de seguimiento MEL oficial ("Anexo 1. Matriz de seguimiento
  // MEL Final 2.0.xlsx", hoja "Seguimiento indicadores"): avance_q1..q4 = % de la
  // meta logrado en cada trimestre (Q1 ene-mar ... Q4 oct-dic), tal como vienen
  // reportados ahí — no se recalculan, solo se convierten de fracción a %.
  sembrarSiVacia_(CONFIG.SHEETS.INDICADORES_MEL, [
    { id: 'MEL1', objetivo_id: 'OBJ1', nombre: 'Número de propuestas de formación por microcredenciales diseñadas y validadas para directivos docentes.', tipo: 'Producto', periodicidad: 'Anual', meta: 1, linea_base: 'No aplica', avance_q1: 60, avance_q2: 40, avance_q3: 0, avance_q4: 0, observaciones: '' },
    { id: 'MEL2', objetivo_id: 'OBJ1', nombre: '% de directivos docentes que completan las microcredenciales de liderazgo.', tipo: 'Producto', periodicidad: 'Anual', meta: 13, linea_base: 'No existe', avance_q1: 0, avance_q2: 33.3, avance_q3: 50, avance_q4: 16.7, observaciones: '' },
    { id: 'MEL3', objetivo_id: 'OBJ1', nombre: '% de directivos docentes que lideran espacios de articulación del proyecto La Universidad en el Campo (mesas de diálogo).', tipo: 'Producto', periodicidad: 'Semestral', meta: 8, linea_base: 'No existe', avance_q1: 0, avance_q2: 0, avance_q3: 100, avance_q4: 0, observaciones: '' },
    { id: 'MEL4', objetivo_id: 'OBJ1', nombre: 'Número de mesas permanentes de diálogo familia-escuela-estudiante implementadas y activas en las instituciones educativas focalizadas.', tipo: 'Producto', periodicidad: 'Semestral', meta: 8, linea_base: 'No existe', avance_q1: 0, avance_q2: 0, avance_q3: 100, avance_q4: 0, observaciones: '' },
    { id: 'MEL5', objetivo_id: 'OBJ1', nombre: 'Porcentaje de rectores que participan en el esquema de acompañamiento entre pares y aplican mejoras sugeridas durante las visitas de retroalimentación.', tipo: 'Resultado', periodicidad: 'Semestral', meta: 4, linea_base: 'No existe', avance_q1: 0, avance_q2: 0, avance_q3: 50, avance_q4: 50, observaciones: '' },
    { id: 'MEL6', objetivo_id: 'OBJ2', nombre: 'Número de mallas curriculares armonizadas.', tipo: 'Producto', periodicidad: 'Anual', meta: 1, linea_base: 'No existe', avance_q1: 0, avance_q2: 100, avance_q3: 0, avance_q4: 0, observaciones: '' },
    { id: 'MEL7', objetivo_id: 'OBJ2', nombre: 'Número de instituciones educativas que aplican un protocolo de procesos para el tránsito de estudiantes de la educación media a posmedia.', tipo: 'Producto', periodicidad: 'Trimestral', meta: 1, linea_base: 'No existe', avance_q1: 0, avance_q2: 0, avance_q3: 100, avance_q4: 0, observaciones: '' },
    { id: 'MEL8', objetivo_id: 'OBJ2', nombre: '% de estudiantes de media que se matriculan en programas técnicos para el año 2026 con respecto al año 2025.', tipo: 'Producto', periodicidad: 'Anual', meta: 191, linea_base: 'Estudiantes matriculados en la cohorte 2025', avance_q1: 0, avance_q2: 100, avance_q3: 0, avance_q4: 0, observaciones: '' },
    { id: 'MEL9', objetivo_id: 'OBJ2', nombre: 'Porcentaje de estudiantes rurales beneficiados con dotación de canasta educativa.', tipo: 'Producto', periodicidad: 'Anual', meta: 191, linea_base: 'No existe', avance_q1: 0, avance_q2: 32.03, avance_q3: 53.05, avance_q4: 14.92, observaciones: '' },
    { id: 'MEL10', objetivo_id: 'OBJ2', nombre: 'Tasa de retención de estudiantes rurales universitarios beneficiados con el plan de asesoría y acompañamiento.', tipo: 'Producto', periodicidad: 'Bimensual', meta: 191, linea_base: '% de permanencia estudiantil registrada en el periodo académico anterior', avance_q1: 0, avance_q2: 50, avance_q3: 49.74, avance_q4: 0, observaciones: 'Tasa de retención: 98,4% (188 de 191 estudiantes activos o en riesgo; 3 desertores según el listado general de estudiantes de agosto).' },
    { id: 'MEL11', objetivo_id: 'OBJ2', nombre: 'Número de programas académicos articulados entre media y posmedia ajustados con enfoque rural.', tipo: 'Producto', periodicidad: 'Anual', meta: 3, linea_base: 'No aplica', avance_q1: 0, avance_q2: 66.67, avance_q3: 33.33, avance_q4: 0, observaciones: '' },
    { id: 'MEL12', objetivo_id: 'OBJ2', nombre: '# de herramientas digitales diseñadas para facilitar la gestión, comunicación y almacenamiento de información de egresados.', tipo: 'Producto', periodicidad: 'Anual', meta: 1, linea_base: 'No aplica', avance_q1: 11.11, avance_q2: 33.33, avance_q3: 33.33, avance_q4: 22.22, observaciones: '' },
    { id: 'MEL13', objetivo_id: 'OBJ2', nombre: 'Porcentaje de estudiantes que mejoran sus resultados académicos entre la prueba de entrada y la prueba de salida.', tipo: 'Resultado', periodicidad: 'Semestral', meta: 191, linea_base: 'Resultados obtenidos en la prueba de entrada aplicada al inicio del proceso', avance_q1: 0, avance_q2: 50, avance_q3: 0, avance_q4: 50, observaciones: '' },
    { id: 'MEL14', objetivo_id: 'OBJ2', nombre: 'Porcentaje de recomendaciones de los Comités Académicos implementadas en ajustes curriculares o de gestión durante el año académico.', tipo: 'Resultado', periodicidad: 'Trimestral', meta: 24, linea_base: 'No aplica', avance_q1: 0, avance_q2: 0, avance_q3: 75, avance_q4: 25, observaciones: '' },
    { id: 'MEL15', objetivo_id: 'OBJ2', nombre: 'Número de sesiones de acudientes a la U desarrolladas.', tipo: 'Producto', periodicidad: 'Trimestral', meta: 12, linea_base: 'No aplica', avance_q1: 0, avance_q2: 0, avance_q3: 75, avance_q4: 25, observaciones: '' },
    { id: 'MEL16', objetivo_id: 'OBJ2', nombre: 'Número de mobiliario entregado a los grupos de La Universidad en el Campo.', tipo: 'Producto', periodicidad: 'Anual', meta: 72, linea_base: 'No aplica', avance_q1: 0, avance_q2: 0, avance_q3: 0, avance_q4: 100, observaciones: '' },
    { id: 'MEL17', objetivo_id: 'OBJ3', nombre: 'Número de docentes capacitados en el modelo Escuela Nueva (Taller 1, Taller 2 y Taller 3).', tipo: 'Producto', periodicidad: 'Anual', meta: 45, linea_base: 'No aplica', avance_q1: 0, avance_q2: 21.48, avance_q3: 45.19, avance_q4: 33.33, observaciones: '' },
    { id: 'MEL18', objetivo_id: 'OBJ3', nombre: 'Número de docentes capacitados en prácticas pedagógicas y nuevas metodologías.', tipo: 'Producto', periodicidad: 'Anual', meta: 45, linea_base: 'No aplica', avance_q1: 0, avance_q2: 0, avance_q3: 100, avance_q4: 0, observaciones: '' },
    { id: 'MEL19', objetivo_id: 'OBJ3', nombre: '% de docentes formados que implementan metodologías activas o el modelo Escuela Nueva en sus clases, posterior al proceso de formación.', tipo: 'Resultado', periodicidad: 'Anual', meta: 90, linea_base: 'No aplica', avance_q1: 0, avance_q2: 0, avance_q3: 30, avance_q4: 70, observaciones: '' },
  ]);

  sembrarSiVacia_(CONFIG.SHEETS.BENEFICIARIOS_RESUMEN, [
    { categoria: 'estudiantes', mujeres: 87, hombres: 104 },
    { categoria: 'adolescencia_13_17', mujeres: 83, hombres: 99 },
    { categoria: 'juventud_18_28', mujeres: 4, hombres: 5 },
    { categoria: 'docentes', mujeres: 21, hombres: 24 },
    { categoria: 'directivos', mujeres: 6, hombres: 7 },
  ]);

  sembrarSiVacia_(CONFIG.SHEETS.INSTITUCIONES, [
    { id: 'IE01', nombre: 'Giovanni Montini', sede: 'Central', estudiantes_2026: 34, estudiantes_2027: 40 },
    { id: 'IE02', nombre: 'Granada', sede: 'Central', estudiantes_2026: 23, estudiantes_2027: 22 },
    { id: 'IE03', nombre: 'José Antonio Galán', sede: 'Central', estudiantes_2026: 38, estudiantes_2027: 43 },
    { id: 'IE04', nombre: 'La Cabaña', sede: 'Central', estudiantes_2026: 22, estudiantes_2027: 26 },
    { id: 'IE05', nombre: 'La Linda', sede: 'Central', estudiantes_2026: 40, estudiantes_2027: 30 },
    { id: 'IE06', nombre: 'La Trinidad', sede: 'Central', estudiantes_2026: 13, estudiantes_2027: 24 },
    { id: 'IE07', nombre: 'La Violeta', sede: 'Central', estudiantes_2026: 12, estudiantes_2027: 12 },
    { id: 'IE08', nombre: 'Maltería', sede: 'El Porvenir', estudiantes_2026: 28, estudiantes_2027: 29 },
    { id: 'IE09', nombre: 'María Goretti', sede: 'Central', estudiantes_2026: 26, estudiantes_2027: 30 },
    { id: 'IE10', nombre: 'Miguel Antonio Caro', sede: 'Central', estudiantes_2026: 28, estudiantes_2027: 23 },
    { id: 'IE11', nombre: 'Rafael Pombo', sede: 'Central', estudiantes_2026: 9, estudiantes_2027: 17 },
    { id: 'IE12', nombre: 'San Peregrino', sede: 'Central', estudiantes_2026: 16, estudiantes_2027: 24 },
    { id: 'IE13', nombre: 'Seráfico', sede: 'Central', estudiantes_2026: 18, estudiantes_2027: 21 },
  ]);

  sembrarSiVacia_(CONFIG.SHEETS.FINANZAS, [
    { id: 'FIN-O1', tipo: 'objetivo', objetivo_id: 'OBJ1', label: 'Objetivo 1 · Liderazgo directivo', presupuestado: 12000000, ejecutado: 18191800, fuente: '', detalle: '' },
    { id: 'FIN-O2', tipo: 'objetivo', objetivo_id: 'OBJ2', label: 'Objetivo 2 · Articulación media-posmedia', presupuestado: 942980591, ejecutado: 741053045, fuente: '', detalle: '' },
    { id: 'FIN-O3', tipo: 'objetivo', objetivo_id: 'OBJ3', label: 'Objetivo 3 · Formación docente Escuela Nueva', presupuestado: 31880330, ejecutado: 7970085, fuente: '', detalle: '' },
    { id: 'FIN-O4', tipo: 'objetivo', objetivo_id: '', label: 'Talento humano (aporte en especie)', presupuestado: 156150000, ejecutado: 85015000, fuente: '', detalle: '' },
    { id: 'FIN-O5', tipo: 'objetivo', objetivo_id: '', label: 'Gestión y operación de la iniciativa', presupuestado: 27849144, ejecutado: 3648845, fuente: '', detalle: '' },
    { id: 'FIN-F1', tipo: 'fuente', objetivo_id: '', label: '', presupuestado: '', ejecutado: 546293930, fuente: 'Fundación PLAN', detalle: 'Convenio 105-COL-FY26-VP-IT-1170' },
    { id: 'FIN-F2', tipo: 'fuente', objetivo_id: '', label: '', presupuestado: '', ejecutado: 173398873, fuente: 'Secretaría de Educación de Manizales', detalle: 'Convenio 2026-0040 (260127-0554)' },
    { id: 'FIN-F3', tipo: 'fuente', objetivo_id: '', label: '', presupuestado: '', ejecutado: 29244445, fuente: 'Aliados (monetario)', detalle: 'Programa Educación para la Competitividad' },
    { id: 'FIN-F4', tipo: 'fuente', objetivo_id: '', label: '', presupuestado: '', ejecutado: 106941526, fuente: 'Aporte en especie (talento humano + aliados)', detalle: 'Especie institucional' },
  ]);

  sembrarSiVacia_(CONFIG.SHEETS.TALENTO_HUMANO, [
    { id: 'TH1', rol: 'Coordinador general del proyecto', valor_mes: 2550000, meses: 9, dedicacion: 30, pct_ejecutado: 43, valor_ejecutado: 9945000 },
    { id: 'TH2', rol: 'Coordinador del proyecto La Universidad en el Campo', valor_mes: 2400000, meses: 9, dedicacion: 30, pct_ejecutado: 45, valor_ejecutado: 9810000 },
    { id: 'TH3', rol: 'Coordinador pedagógico', valor_mes: 0, meses: 9, dedicacion: 0, pct_ejecutado: 0, valor_ejecutado: 0 },
    { id: 'TH4', rol: 'Auxiliar administrativo', valor_mes: 1600000, meses: 9, dedicacion: 20, pct_ejecutado: 43, valor_ejecutado: 6240000 },
    { id: 'TH5', rol: 'Asesor pedagógico 1', valor_mes: 1800000, meses: 9, dedicacion: 30, pct_ejecutado: 43, valor_ejecutado: 7020000 },
    { id: 'TH6', rol: 'Asesor pedagógico 2', valor_mes: 1800000, meses: 9, dedicacion: 30, pct_ejecutado: 43, valor_ejecutado: 7020000 },
    { id: 'TH7', rol: 'Experto en tecnología', valor_mes: 3000000, meses: 9, dedicacion: 50, pct_ejecutado: 43, valor_ejecutado: 11700000 },
    { id: 'TH8', rol: 'Profesional en Proyectos Pedagógicos Productivos', valor_mes: 3000000, meses: 9, dedicacion: 20, pct_ejecutado: 43, valor_ejecutado: 11700000 },
    { id: 'TH9', rol: 'Profesional en Escuela Virtual', valor_mes: 1200000, meses: 9, dedicacion: 20, pct_ejecutado: 43, valor_ejecutado: 4680000 },
  ]);

  sembrarSiVacia_(CONFIG.SHEETS.ALERTAS, [
    { id: 'AL-EXT-1', tipo: 'otro', severidad: 'baja', descripcion: 'Deserción de 2 estudiantes (1.05% de los 191 matriculados).', producto_id: '', indicador_id: '', fecha: '2026-07-31', estado: 'activa', accion: 'Revisar la afectación en indicadores ligados al número de estudiantes matriculados. Responsable: Coordinación general del proyecto.' },
  ]);

  sembrarSiVacia_(CONFIG.SHEETS.INFO_ADICIONAL, [
    { id: 'INFO1', territorial: 0, estado_general: '', estado_mel: '', desercion_cantidad: 0, desercion_base: 0, universidades: '', meta_directos_meta: 0, meta_directos_alcanzado: 0, meta_indirectos_meta: 0, meta_indirectos_alcanzado: 0 },
  ]);
}

/** Siembra filas solo si la hoja está vacía (sin datos, además del encabezado), para no duplicar en re-ejecuciones. */
function sembrarSiVacia_(nombreHoja, filas) {
  if (leerHojaComoObjetos_(nombreHoja).length > 0) return;
  filas.forEach(f => agregarFila_(nombreHoja, f));
}
