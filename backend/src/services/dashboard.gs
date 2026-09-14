/** KPIs consolidados para la vista de Dashboard (spec sección 8.1). */
const DashboardService = {
  obtener() {
    const objetivos = ObjetivosService.listar();
    const productos = ProductosService.listar();
    const finanzas = FinanzasService.listar();
    const alertas = AlertasService.listar();

    const totalPresupuestado = finanzas.por_objetivo.reduce((s, f) => s + Number(f.presupuestado || 0), 0);
    const totalEjecutado = finanzas.por_objetivo.reduce((s, f) => s + Number(f.ejecutado || 0), 0);
    const avanceFinanciero = totalPresupuestado ? (totalEjecutado / totalPresupuestado) * 100 : 0;

    const avanceTecnico = totalPresupuestado
      ? objetivos.reduce((s, o) => s + o.avance_actual * (Number(o.presupuestado || 0) / totalPresupuestado), 0)
      : 0;

    const conteoSemaforo = { verde: 0, amarillo: 0, rojo: 0, gris: 0, azul: 0 };
    productos.forEach(p => { conteoSemaforo[p.color]++; });

    return {
      avance_tecnico: Math.round(avanceTecnico * 100) / 100,
      avance_financiero: Math.round(avanceFinanciero * 100) / 100,
      total_presupuestado: totalPresupuestado,
      total_ejecutado: totalEjecutado,
      semaforo_productos: conteoSemaforo,
      alertas_activas: alertas.filter(a => a.estado === 'activa').length,
      objetivos: objetivos,
    };
  },
};
