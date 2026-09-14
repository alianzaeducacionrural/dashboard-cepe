# Backend — La Universidad en el Campo (Google Apps Script + clasp)

Todo el código ya está escrito, `clasp` ya está instalado globalmente, y el Sheet
ya existe en el lugar correcto. Lo único que falta son los pasos que requieren tu
cuenta de Google (login interactivo y vínculo del proyecto de Apps Script), que
debes ejecutar tú mismo desde la terminal — esa autenticación no se puede hacer
por ti.

## 0. Ya hecho

- ✅ `npm install -g @google/clasp` (v3.4.1)
- ✅ Sheet **"Ucampo Backend"** creado dentro de la carpeta institucional de Drive:
  https://docs.google.com/spreadsheets/d/1CEkTblXdfejSXYhGXPzhjFcJUtTZef8friqRQTpN_m8/edit
  (dueño: `edurural.osorio.alejandro@gmail.com` — usa esa cuenta en `clasp login` si no es la que ya tienes activa).

## 1. Login (abre el navegador para autorizar)

```
clasp login
```

## 2. Vincular un proyecto de Apps Script a ese Sheet

Abre el Sheet de arriba → **Extensiones → Apps Script**. Esto crea automáticamente
un proyecto de Apps Script vacío y vinculado (container-bound). En el editor que
se abre, ve a **Configuración del proyecto** (ícono de engranaje) y copia el
**ID de secuencia de comandos** (Script ID).

## 3. Conectar clasp a ese proyecto SIN pisar nuestro código

⚠️ No uses `clasp clone` aquí: bajaría un `Code.gs` y un `appsscript.json` vacíos
y sobrescribiría el `appsscript.json` que ya configuramos (permisos, tipo de
despliegue). En vez de eso, crea el archivo `backend/.clasp.json` a mano con este
contenido (reemplaza `<SCRIPT_ID>` por el que copiaste):

```json
{ "scriptId": "<SCRIPT_ID>", "rootDir": "." }
```

## 4. Subir el código

```
clasp push
```

Esto sube todos nuestros archivos y reemplaza el `appsscript.json` por defecto
por el nuestro. Queda un `Code.gs` vacío huérfano (el que Apps Script crea al
vincular el proyecto) — es inofensivo, pero puedes borrarlo desde `clasp open`
si quieres dejarlo limpio.

## 5. Inicializar las hojas y los datos reales (una sola vez)

```
clasp open
```

En el editor de Apps Script que se abre: selecciona la función `inicializar`
en el desplegable de funciones (arriba) y presiona **Ejecutar**. La primera vez
te pedirá autorizar permisos sobre el Sheet — acéptalos. Esto:
- crea las 11 hojas con encabezados,
- siembra los datos reales de corte agosto 2026 (los mismos del prototipo `index.html`).

Puedes volver a ejecutar `inicializar` sin miedo: no duplica filas si la hoja ya tiene datos.

**Contraseña de admin**: por seguridad no vive en el código (este repo es público). Configúrala ejecutando, una sola vez desde este mismo editor de Apps Script, `establecerPasswordAdmin('tu-contraseña')` (reemplaza el texto por la contraseña real) desde el desplegable de funciones. Puedes volver a ejecutarla cuando quieras para cambiarla.

Opcionalmente, corre `ejecutarTodasLasPruebas` (en `tests/test_services.gs`) para
verificar que las reglas de semáforo y el dashboard calculan correctamente.

## 6. Publicar como Web App

```
clasp deploy --description "v1"
```

Copia la URL que termina en `/exec` — esa es tu `GAS_URL`.

## 7. Conectar el frontend

En `index.html` (raíz del proyecto) reemplaza los datos estáticos por llamadas
`fetch(GAS_URL + '?action=...')`, o dime cuando llegues aquí y lo conecto yo.

## Cada vez que cambies el código del backend

```
clasp push
clasp deploy --description "descripción del cambio"
```

`clasp push` sube el código al proyecto; `clasp deploy` crea una nueva versión
publicada de la Web App (si no vuelves a desplegar, la URL `/exec` sigue sirviendo
la versión anterior).

## Ver documentación de endpoints

Ver [`docs/API.md`](docs/API.md).
