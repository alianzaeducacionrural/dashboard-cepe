/**
 * Punto de entrada de la Web App (spec sección 11.3).
 * GET  -> lecturas públicas (dashboard de solo lectura, sin token).
 * POST -> escrituras, todas requieren "token" salvo action=login.
 */

function doGet(e) {
  try {
    const action = e.parameter.action;
    const rutas = {
      getAll: () => ({
        objetivos: ObjetivosService.listar(),
        productos: ProductosService.listar(),
        actividades: ActividadesService.listar(),
        mel: MelService.listar(),
        beneficiarios: BeneficiariosService.listar(),
        instituciones: InstitucionesService.listar(),
        finanzas: FinanzasService.listar(),
        alertas: AlertasService.listar(),
        infoAdicional: InfoAdicionalService.obtener(),
      }),
      getObjetivos: () => ObjetivosService.listar(),
      getProductos: () => ProductosService.listar(),
      getActividades: () => ActividadesService.listar(),
      getMEL: () => MelService.listar(),
      getBeneficiarios: () => BeneficiariosService.listar(),
      getInstituciones: () => InstitucionesService.listar(),
      getFinanzas: () => FinanzasService.listar(),
      getAlertas: () => AlertasService.listar(),
      getInfoAdicional: () => InfoAdicionalService.obtener(),
      getDashboard: () => DashboardService.obtener(),
    };
    if (!action || !rutas[action]) return jsonError_('Acción no reconocida: ' + action);
    return jsonSuccess_(rutas[action]());
  } catch (err) {
    return jsonError_(err.message);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'login') {
      requireFields_(body, ['password']);
      return jsonSuccess_(AuthService.login(body.password));
    }

    if (!AuthService.validarToken(body.token)) {
      return jsonError_('Token inválido o expirado. Inicia sesión nuevamente.');
    }

    const rutas = {
      createObjetivo: () => ObjetivosService.crear(body),
      updateObjetivo: () => ObjetivosService.actualizar(body),
      deleteObjetivo: () => ObjetivosService.eliminar(body),
      createProducto: () => ProductosService.crear(body),
      updateProducto: () => ProductosService.actualizar(body),
      deleteProducto: () => ProductosService.eliminar(body),
      createActividad: () => ActividadesService.crear(body),
      updateActividad: () => ActividadesService.actualizar(body),
      deleteActividad: () => ActividadesService.eliminar(body),
      createMEL: () => MelService.crear(body),
      updateMEL: () => MelService.actualizar(body),
      deleteMEL: () => MelService.eliminar(body),
      updateBeneficiarios: () => BeneficiariosService.actualizar(body),
      createInstitucion: () => InstitucionesService.crear(body),
      updateInstitucion: () => InstitucionesService.actualizar(body),
      deleteInstitucion: () => InstitucionesService.eliminar(body),
      updateFinanza: () => FinanzasService.actualizar(body),
      updateTalento: () => TalentoService.actualizar(body),
      updateInfoAdicional: () => InfoAdicionalService.actualizar(body),
      createAlerta: () => AlertasService.crear(body),
      resolveAlerta: () => AlertasService.resolver(body),
      // inicializar() es idempotente (crearHojas/sembrarSiVacia_ solo actúan sobre hojas
      // faltantes o vacías) — segura para volver a llamarla cuando se agrega una hoja nueva
      // al esquema (como INFO_ADICIONAL) sin tener que abrir el editor de Apps Script.
      runInicializar: () => { inicializar(); return { ok: true }; },
    };
    if (!rutas[action]) return jsonError_('Acción no reconocida: ' + action);
    return jsonSuccess_(rutas[action]());
  } catch (err) {
    return jsonError_(err.message);
  }
}
