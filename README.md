# Job.Track

Seguimiento de vacantes de trabajo con sync en la nube y sugerencias automáticas desde Gmail. PWA instalable en móvil y desktop, offline-first, sin frameworks ni dependencias externas.

**Stack:** HTML + CSS + Vanilla JS · Google Apps Script · Google Sheets · GitHub Pages

> Filosofía: la app **sugiere, nunca decide**. Toda automatización escribe sugerencias que tú confirmas con un tap. Paleta clara y cálida ("Mañana despejada") diseñada para que buscar trabajo no se sienta como monitorear un dashboard de alarmas.

---

## Features

- **CRUD completo** de vacantes con edición inline y modal de detalle (URL, contacto, salario esperado, notas)
- **Pipeline de estatus:** Applied → Screening → Interview → Offer / Rejected / Ghosted
- **Sync multi-dispositivo** vía Google Sheets: offline-first con localStorage, cola de operaciones pendientes, resolución de conflictos last-write-wins por timestamp
- **Alta desde Claude:** al generar un CV, un link agrega la vacante directo al backend (`?action=add`) o abre la PWA con datos precargados (`?add=Empresa|Rol|Prioridad`)
- **Robot de Gmail** (cada 30 min): lee correos de tus procesos activos, filtra newsletters/alertas, y clasifica con keywords ES/EN — Offer, Rejected, Interview, Screening
- **Gemini opcional** para clasificar correos ambiguos (solo si configuras la API key)
- **Auto-Ghosted:** 21 días en Applied sin un solo correo real → sugiere Ghosted
- **Sugerencias, no cambios:** el robot escribe `estatus_sugerido`; en la app aparece como badge 📬 que aceptas o ignoras. Las sugerencias solo escalan en el pipeline, nunca degradan (excepto Rejected/Ghosted, que siempre se avisan)
- Filtros por estatus, columnas configurables, export CSV (BOM UTF-8), stats en tiempo real, instalación PWA, indicador de estado de sync

## Arquitectura

```
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│ PWA (móvil   │  │ Link desde   │  │ Deep link   │
│ y desktop)   │  │ Claude (CV)  │  │ ?add=...    │
└──────┬───────┘  └──────┬───────┘  └──────┬──────┘
       └─────────────────┼─────────────────┘
                         ▼
              ┌─────────────────────┐
              │     Apps Script      │  API REST + token
              │  (doPost / doGet)    │  last-write-wins
              └──────────┬───────────┘
                         ▼
              ┌─────────────────────┐
              │    Google Sheets     │  hoja "Vacantes"
              │   (base de datos)    │  16 columnas
              └──────────▲───────────┘
                         │ estatus_sugerido
              ┌──────────┴───────────┐
              │   Robot de Gmail     │  trigger 30 min
              │  keywords + Gemini   │  → tú confirmas en la app
              └─────────────────────┘
```

Todo vive en tu propia cuenta de Google. Ningún tercero lee tu correo ni tus datos.

## Estructura del repo

| Archivo | Descripción |
|---|---|
| `index.html` | App completa (UI, lógica, capa de sync) en un solo archivo |
| `sw.js` | Service worker: network-first para el shell, nunca cachea el backend |
| `Code.gs` | Backend de Apps Script (no se sube a Pages; vive en tu Sheet) |

## Setup

### 1. Backend (~10 min)

1. Crea un Google Sheet nuevo → **Extensiones → Apps Script**
2. Pega el contenido de `Code.gs`
3. Cambia `var TOKEN = '...'` por un token largo y aleatorio
4. Ejecuta `setup()` desde el editor (autoriza permisos) — crea la hoja `Vacantes`
5. Ejecuta `installTrigger()` (autoriza Gmail) — instala el trigger de 30 min
6. *(Opcional)* Configuración del proyecto ⚙ → Propiedades del script → agrega `GEMINI_API_KEY` con tu key de [AI Studio](https://aistudio.google.com)
7. **Implementar → Nueva implementación → App web** → Ejecutar como: *tú* → Acceso: *cualquier persona* → copia la URL `/exec`

### 2. Frontend (~5 min)

1. Sube `index.html` y `sw.js` a tu repo con GitHub Pages habilitado
2. Abre la app → modal de configuración → pega URL `/exec` + token → **Conectar**
3. Repite en tu otro dispositivo con la misma URL + token

### 3. Verificación

- `testClassify()` en el editor → debe loggear `Interview`, `Rejected` y vacío
- `testSyncGmail()` → revisa el log; las sugerencias aparecen en la columna `estatus_sugerido` y como badge 📬 en la app

## Schema de la hoja `Vacantes`

`id · empresa · rol · estatus · prioridad · fecha_aplicacion · proximo_paso · notas · url · contacto · salario · email_thread_id · estatus_sugerido · ultima_actualizacion · fuente · eliminado`

No insertes columnas en medio del schema — agrega siempre al final. Los borrados son tombstones (`eliminado = TRUE`), nunca se eliminan filas.

## Seguridad

- El token da lectura/escritura total a la hoja: **no lo publiques** ni lo dejes en links compartidos
- La API key de Gemini vive solo en Script Properties, nunca en el código ni en el repo
- Si un token o key se expone, bórralo y genera uno nuevo (en Apps Script: cambiar `TOKEN` y re-implementar)

## Mantenimiento

- Al publicar cambios de frontend, incrementa `CACHE` en `sw.js` (fuerza refresh en iOS PWA)
- Para afinar el clasificador, edita las listas `KW` y `NOISE` en `Code.gs`
- `GHOSTED_DAYS` controla el umbral de auto-Ghosted (default: 21 días)

## Licencia

Uso personal. Hecho con ☕ en Zapopan, GDL.
