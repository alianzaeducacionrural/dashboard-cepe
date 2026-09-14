/**
 * Pruebas manuales para ejecutar desde el editor de Apps Script
 * (no hay framework de test en GAS; cada función usa console.assert
 * y registra en el log). Ejecutar `ejecutarTodasLasPruebas` tras
 * correr `inicializar()` en setup.gs.
 */

function ejecutarTodasLasPruebas() {
  testCalcularPctEsperado();
  testSemaforo();
  testDashboard();
  Logger.log('Todas las pruebas pasaron.');
}

function testCalcularPctEsperado() {
  console.assert(calcularPctEsperado_(1, 4, 6) === 100, 'debe ser 100% si ya pasó el mes de cierre');
  console.assert(calcularPctEsperado_(3, 8, 1) === 0, 'debe ser 0% si aún no inicia');
  console.assert(calcularPctEsperado_(1, 9, 5) === 56, 'mitad del rango aprox. 56%');
}

function testSemaforo() {
  console.assert(calcularColorSemaforo_(100, 80, 1, 4, 6) === 'azul', 'completado debe ser azul');
  console.assert(calcularColorSemaforo_(0, 0, 7, 9, 6) === 'gris', 'no iniciado debe ser gris');
  console.assert(calcularColorSemaforo_(10, 100, 1, 4, 6) === 'rojo', 'muy retrasado y vencido debe ser rojo');
}

function testDashboard() {
  const dash = DashboardService.obtener();
  console.assert(typeof dash.avance_tecnico === 'number', 'avance_tecnico debe ser numérico');
  console.assert(dash.semaforo_productos.azul + dash.semaforo_productos.verde + dash.semaforo_productos.amarillo + dash.semaforo_productos.rojo + dash.semaforo_productos.gris > 0, 'debe contar productos');
  Logger.log(JSON.stringify(dash));
}
