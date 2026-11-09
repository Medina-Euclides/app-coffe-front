# CafeSmart Frontend

Interfaz web de **CafeSmart**, un sistema de gestión cafetera **offline-first** para pequeños y medianos productores. Construido con **React 19, Vite, Tailwind CSS 4 y shadcn/ui**, consume una API en **Django REST Framework** y funciona como **PWA** instalable con almacenamiento local en IndexedDB y sincronización en segundo plano.

## Stack tecnológico

| Tecnología | Versión aproximada | Uso |
|---|---|---|
| React | 19.x | Interfaz de usuario |
| Vite | 8.x | Servidor de desarrollo y compilación |
| Tailwind CSS | 4.x | Estilos utilitarios |
| shadcn/ui (base `@shadcn/react`, `@base-ui/react`) | — | Componentes de interfaz base |
| react-router-dom | 7.x | Navegación y guardas de acceso |
| axios | 1.x | Cliente HTTP para la API |
| Dexie | 4.x | Almacenamiento local en IndexedDB (modo offline) |
| lucide-react | 1.x | Iconografía |
| recharts | 3.x | Gráficos y analíticas |
| react-day-picker | 10.x | Selector de fechas |
| vite-plugin-pwa | 2.x | Progressive Web App y service worker |
| oxlint | 1.x | Linter de código |

## Estructura del proyecto

```
app-coffe-front/
├── public/
│   ├── icon.png
│   ├── pwa-192.png
│   └── pwa-512.png
├── src/
│   ├── App.jsx              # Componente raíz de la aplicación
│   ├── main.jsx             # Punto de entrada (Vite + React)
│   ├── index.css            # Estilos globales de Tailwind
│   ├── components/
│   │   ├── ui/              # Base de shadcn/ui (no modificar directamente)
│   │   ├── layout/          # Estructura y navegación global (menús, barras laterales)
│   │   └── shared/          # Componentes compartidos entre áreas:
│   │                        #   ItemCard, StatusBadge, ActionButton,
│   │                        #   NoticeBanner, SectionHeader, EmptyState,
│   │                        #   ManagementPage, SyncStatus
│   ├── pages/               # Pantallas agrupadas por área funcional
│   │   ├── inicio/
│   │   ├── actividades/
│   │   ├── fincas/
│   │   ├── trabajadores/
│   │   ├── workday/         # Jornadas laborales
│   │   ├── payment/         # Liquidaciones y pagos
│   │   ├── finance/         # Finanzas
│   │   ├── analytics/       # Métricas y gráficos
│   │   ├── assistant/       # Asistente
│   │   ├── auth/            # Autenticación (login, registro)
│   │   └── configuracion/
│   ├── routes/
│   │   ├── RoutesApp.jsx    # Definición de rutas de la aplicación
│   │   └── RouteGuards.jsx  # Guardas de acceso y protección de rutas
│   ├── lib/
│   │   ├── constants.js     # Constantes de la aplicación
│   │   ├── dates.js         # Utilidades de fechas
│   │   ├── db.js            # Esquema y conexión de Dexie (IndexedDB)
│   │   ├── formatters.js    # Formateo de datos para pantallas
│   │   ├── storage.js       # Utilidades de almacenamiento local
│   │   ├── utils.js         # Funciones de utilidad generales
│   │   ├── validation.js    # Validaciones de formularios
│   │   └── domain/          # Lógica de dominio por entidad
│   ├── hooks/
│   │   ├── useApiList.js
│   │   ├── useApiResource.js
│   │   ├── useCrudList.js
│   │   ├── useDialog.js
│   │   ├── useNotice.js
│   │   ├── useSearchFilter.js
│   │   ├── useOnlineStatus.js
│   │   ├── use-mobile.js
│   │   ├── useConfirm.js
│   │   ├── useFormFeedback.js
│   │   └── usePendingWorkdays.js
│   └── services/
│       ├── api.js           # Cliente de axios y endpoints de la API
│       ├── syncService.js   # Servicio de sincronización con el backend
│       ├── syncQueue.js     # Cola de operaciones pendientes offline
│       ├── offlineStore.js  # Almacenamiento de datos en modo offline
│       ├── connectivity.js  # Detección de conectividad de red
│       ├── farmStorage.js   # Almacenamiento local de fincas y lotes
│       └── localAnalytics.js
├── vite.config.js           # Configuración de Vite, proxy de API y PWA
├── netlify.toml             # Despliegue en Netlify (build, redirects, headers)
├── .env.local               # Variables de entorno de desarrollo
├── package.json             # Dependencias y scripts
└── README.md
```

Cada carpeta dentro de `pages/` contiene las pantallas de esa área y, cuando aplica, su propia carpeta `components/` para componentes de uso local. Los componentes que se reutilizan entre áreas van en `components/shared/`. Los componentes base de shadcn permanecen en `components/ui/` sin modificarlos directamente.

## Componentes compartidos (`components/shared/`)

- **ItemCard** — tarjeta genérica de entidad (avatar, título, subtítulo, detalles, badge y fila de acciones).
- **StatusBadge** — badge de estado con colores consistentes (Activo/Inactivo, Recolección/Labor).
- **ActionButton** — botón ghost con estilos consistentes para acciones de tarjeta.
- **NoticeBanner** — banner de aviso (éxito/error) con `aria-live` para accesibilidad.
- **SectionHeader** — título de sección con `id` para accesibilidad.
- **EmptyState**, **ManagementPage**, **SyncStatus** — componentes de listado reutilizados en páginas de gestión.

## Hooks globales (`src/hooks/`)

- `useApiList(storageKey, fetchFn, saveFn)` — carga una lista desde la API con caché en localStorage. Devuelve `data`, `setData`, `loading`, `error` y `refetch`.
- `useApiResource(resource)` — gestiona un recurso único (CRUD) desde la API.
- `useCrudList(...)` — operaciones de listado con creación, edición y eliminación.
- `useDialog()` — maneja apertura/cierre de diálogos con un elemento opcional seleccionado.
- `useNotice()` — mensaje de aviso temporal (éxito o error) con `show(message, isError)` y `clear()`.
- `useSearchFilter(items, getSearchText)` — filtra una lista por texto de búsqueda. Devuelve `search`, `setSearch` y `filtered`.
- `useOnlineStatus()` — detecta si el navegador está en línea o fuera de línea.
- `use-mobile()` — detecta si la pantalla está por debajo del breakpoint móvil (768px).
- `useConfirm()` — solicita confirmación al usuario antes de una acción.
- `useFormFeedback()` — retroalimentación de estado en formularios.
- `usePendingWorkdays()` — jornadas con operaciones pendientes de sincronización.

## Capa de datos y modo offline

La aplicación almacena datos localmente con **Dexie sobre IndexedDB** (`src/lib/db.js`) para funcionar sin conexión:

- `offlineStore.js` — guarda registros mientras no hay conexión.
- `syncQueue.js` — cola de operaciones pendientes (crear, editar, eliminar) para reenviar al recuperar conexión.
- `syncService.js` — procesa la cola y sincroniza con el backend.
- `connectivity.js` — detecta cambios de estado de red (en línea / fuera de línea).
- `farmStorage.js` — copia local de fincas y lotes para módulos que aún leen desde el almacenamiento del navegador.

## PWA (Progressive Web App)

Configurada con `vite-plugin-pwa` y Workbox en `vite.config.js`:

- Precachea todo el build (JS, CSS, HTML, imágenes, fuentes) para que la app abra sin internet.
- Navigate fallback a `/index.html` para soporte de rutas de React Router.
- Service worker con `Cache-Control: no-cache` en Netlify para que las actualizaciones llegue rápidamente.
- Manifest con nombre `CafeSmart - Gestión Cafetera`, íconos 192 y 512 px, modo `standalone` y orientación `portrait`.
- Las peticiones a la API no se cachean en el service worker: los datos viven en IndexedDB.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor local de Vite (host expuesto para redes locales). |
| `npm run dev:cloud` | Inicia Vite con `BACKEND_URL=https://mysite-cmyl.onrender.com` para pruebas en la nube. |
| `npm run build` | Genera la compilación de producción en `dist/`. |
| `npm run preview` | Previsualiza la compilación de producción localmente. |
| `npm run lint` | Ejecuta Oxlint sobre el proyecto. |

## Variables de entorno y proxy de API

En desarrollo, Vite reenvía las llamadas de la API a Django en el mismo dominio, de modo que front y backend comparten origen y no se requiere configurar CORS. Esto permite probar con un solo túnel HTTPS (por ejemplo, cloudflared) desde el celular.

Archivo `.env.local`:

```env
VITE_API_URL=/
```

La URL del backend se define en `vite.config.js`:

```js
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
```

Se reenvían los prefijos `/accounts`, `/farms`, `/labor`, `/payroll`, `/finance`, `/production`, `/analytics`, `/assistant` y `/sync` al backend.

Para otra instancia, define `VITE_API_URL` en `.env.local`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

## Autenticación y conexión con Django REST Framework

El cliente consume la API local en `http://127.0.0.1:8000` de forma predeterminada.

1. Inicia Django con `python manage.py runserver`.
2. Inicia React con `npm run dev`.
3. La API local debe permitir CORS desde el origen de Vite (`http://localhost:5173`) si no usas el proxy de Vite.

### Endpoints de autenticación

- `POST /accounts/login/` — inicio de sesión; devuelve tokens JWT (access y refresh).
- `POST /accounts/register/` — registro; envía `first_name`, `last_name`, `email`, `phone_number` y `password`.

Después de registrarse, el cliente inicia sesión para obtener los JWT. Conserva los tokens en el navegador y envía el token de acceso como `Authorization: Bearer <access>` en las peticiones protegidas.

### Endpoints principales por grupo

- **Fincas y lotes**: `GET`/`POST`/`PATCH /farms/` y `GET`/`POST`/`PATCH /farms/lots/`. Campos del modelo DRF: `name`, `location`, `description`, `id_farm`, `coffee_variety`, `area_hectares`, `is_active`.
- **Trabajadores**: `GET`/`POST /labor/workers/` y `PATCH /labor/workers/{id}/`. Campos: `first_name`, `last_name`, `identification`, `phone`, `is_active`. La identificación y el teléfono son opcionales. No ofrece borrado físico desde la interfaz; se usa desactivación/reactivación para preservar el historial de jornadas.
- **Tipos de actividad**: CRUD de `/labor/activity-types/` con `name`, `description` e `is_harvest` (indica si admite pago por kilogramo).
- **Jornadas**: creación en `/labor/workdays/` con `farm` y `date`; participación de trabajador en `/labor/workday-workers/` con `workday`, `worker`, `payment_mode` y `agreed_rate`; detalle por lote en `/labor/workday-details/` con `workday_worker`, `activity_type` y `lot`.
  - `POST /labor/workday-workers/{id}/cancel/` — retira una participación pendiente.
  - `POST /labor/workday-workers/{id}/reactivate/` — reactiva una participación retirada en la misma jornada.
  - `POST /labor/workdays/{id}/close/` — cierra una jornada (no permite modificaciones después).
  - `PATCH /labor/workdays/{id}/labor/` — actualiza actividad, modalidad y tarifa para participaciones no anuladas.
- **Pesajes**: `POST /labor/harvest-records/` con `workday_detail`, `quantity_kg` y `time`. El servidor valida que el detalle sea de recolección y que la jornada y participación sigan abiertas.
- **Pagos y liquidaciones**: `/payroll/settlements/`, `/payroll/settlement-workdays/`, `/payroll/settlement-harvests/` y `/payroll/payments/`.
  - `POST /payroll/settlements/pay/` — registra el pago y cierra la liquidación si hace falta.

## Despliegue en Netlify

Configurado en `netlify.toml`:

- Comando de build: `npm run build`
- Carpeta publicada: `dist`
- Redirects SPA: cualquier ruta sirve `/index.html` (estado 200) para navegación con React Router.
- Headers: el service worker (`/sw.js`) no se cachea (`Cache-Control: no-cache`) para que las actualizaciones lleguen al usuario.

## Buenas prácticas y convenciones

- Usar ternarios en lugar de `&&` para renderizado condicional.
- Aislar tarjetas y componentes de lista para evitar re-renders innecesarios (`memo`).
- Usar `use-deferred-value` en búsquedas y filtros para mantener los inputs fluidos.
- Usar `Promise.all` para cargas independientes en paralelo (por ejemplo, fincas + lotes).
- Usar `Map` para búsquedas por ID en lugar de llamar a `.find` repetidamente.
- Aplicar `content-visibility` en listas largas para contención de render.
- No modificar los componentes base de `components/ui/`; componer sobre shadcn sin tocar los archivos originales.

## Requisitos previos

- Node.js 22 o superior (definido en `netlify.toml`).
- npm o tu gestor de paquetes preferido.
- Backend Django REST Framework ejecutándose (local u otro instancia definida en `VITE_API_URL`).

---

Documentación del frontend de CafeSmart. Mantén este archivo actualizado cuando se agreguen nuevas rutas, páginas, hooks o servicios.