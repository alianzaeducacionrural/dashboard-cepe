/**
 * Autenticación simple de un solo rol "admin" (spec sección 14).
 * No hay usuarios individuales: una contraseña compartida + token temporal
 * en CacheService (expira solo, sin necesidad de limpieza manual).
 */

const AuthService = {
  login(password) {
    if (password !== getAdminPassword_()) {
      throw new Error('Contraseña incorrecta.');
    }
    const token = Utilities.getUuid();
    CacheService.getScriptCache().put('token_' + token, 'valido', CONFIG.TOKEN_TTL_SECONDS);
    registrarLog_('login', { ok: true });
    return { token: token, expira_en_segundos: CONFIG.TOKEN_TTL_SECONDS };
  },

  validarToken(token) {
    if (!token) return false;
    return CacheService.getScriptCache().get('token_' + token) === 'valido';
  },
};
