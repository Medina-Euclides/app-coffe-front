# CafeSmart Frontend

Interfaz web de **CafeSmart**, un sistema de gestión cafetera **offline-first** para pequeños y medianos productores. Construido con **React 19, Vite y Tailwind CSS 4** (componentes sobre shadcn/ui), consume una API en **Django REST Framework** y funciona como **PWA instalable** con almacenamiento local en IndexedDB. Permite administrar fincas, lotes, trabajadores, actividades, jornadas, pesajes, pagos y finanzas incluso sin conexión a internet.

---

## Estructura del proyecto

```
app-coffe-front/
├── public/              # Iconos PWA (icon.png, pwa-192.png, pwa-512.png)
├── src/
│   ├── App.jsx          # Componente raíz
│   ├── main.jsx         # Punto de entrada (Vite + React)
│   ├── index.css        # Estilos globales (Tailwind CSS 4)
│   ├── components/
│   │   ├── ui/          # Base de shadcn/ui (no se modifican los base)
│   │   ├── layout/      # Estructura y navegación global (menús, barras laterales)
│   │   └── shared/      # Componentes compartidos entre áreas (tarjetas, banners, buscadores, etc.)
│   ├── pages/           # Pantallas agrupadas por área:
│   │   ├── inicio/      # Inicio
│   │   ├── fincas/      # Fincas y lotes
│   │   ├── trabajadores/# Trabajadores
│   │   ├── actividades/ # Tipos de actividad
│   │   ├── workday/     # Jornadas laborales
│   │   ├── payment/     # Liquidaciones y pagos
│   │   ├── finance/     # Movimientos financieros
│   │   ├── analytics/   # Métricas y gráficos
│   │   ├── assistant/   # Asistente IA
│   │   ├── auth/        # Login y registro
│   │   └── configuracion/ # Configuración inicial
│   ├── routes/          # RoutesApp.jsx (rutas con lazy loading) y RouteGuards.jsx (protección de acceso)
│   ├── lib/             # Utilidades: constants, dates, db (IndexedDB/Dexie), formatters, storage, utils, validation, domain/
│   ├── hooks/           # Hooks globales: useApiList, useApiResource, useCrudList, useDialog, useNotice, useSearchFilter, useOnlineStatus, use-mobile, useConfirm, useFormFeedback, usePendingWorkdays
│   └── services/        # Capa API y sincronización: api.js, connectivity.js, syncService.js, syncQueue.js, offlineStore.js, farmStorage.js, localAnalytics.js
├── vite.config.js       # Vite, Tailwind, PWA (Workbox), proxy de API y chunks de build
├── netlify.toml         # Despliegue en Netlify (build, redirects SPA, headers del service worker)
├── .env.local           # VITE_API_URL=/ (el front y backend comparten dominio vía proxy de Vite)
├── package.json         # Dependencias y scripts
└── README.md
```

Cada carpeta dentro de `pages/` contiene sus pantallas y, cuando aplica, sus propias carpetas `components/` y `hooks/` de uso local. Los componentes que se reutilizan entre áreas viven en `components/shared/`; los componentes base de shadcn permanecen en `components/ui/` sin editarse directamente.

---

## Partes más esenciales

| Parte | Qué hace |
|---|---|
| **Autenticación** (`pages/auth/`) | Login y registro con JWT. Guarda tokens en `localStorage` y los envía como `Authorization: Bearer <access>` en peticiones protegidas. |
| **Fincas y lotes** (`pages/fincas/`) | CRUD de fincas y lotes asociados. Búsqueda por nombre, ubicación o variedad. |
| **Trabajadores** (`pages/trabajadores/`) | CRUD de trabajadores. Usa desactivación/reactivación en lugar de borrado físico para preservar el historial de jornadas. |
| **Jornadas** (`pages/workday/`) | Crear jornada con finca y fecha; agregar varios trabajadores y lotes; cerrar jornada; cancelar/reactivar participaciones; actualizar actividad y tarifa en lote. |
| **Pesajes** | Registrar `quantity_kg` y `time` dentro de una jornada abierta con actividad de recolección. |
| **Pagos y liquidaciones** (`pages/payment/`) | Liquidar jornadas cerradas y pagos por jornal o por kilogramo. Pestañas de pendientes y realizados con filtros. |
| **Finanzas y analíticas** (`pages/finance/`, `pages/analytics/`) | Movimientos financieros y gráficos con recharts. |
| **Rutas y guardas** (`src/routes/`) | `RoutesApp.jsx` define las rutas con carga perezosa (`React.lazy` + `Suspense`). `RouteGuards.jsx` protege el acceso según autenticación y estado de configuración inicial. |

---

## Stack de tecnologías y librerías principales

| Tecnología | Uso |
|---|---|
| React 19 | Interfaz de usuario |
| Vite 8 | Servidor de desarrollo y compilación de producción |
| Tailwind CSS 4 | Estilos utilitarios |
| shadcn/ui (`@shadcn/react`, `@base-ui/react`) | Componentes de interfaz base |
| react-router-dom 7 | Navegación y guardas de acceso |
| axios | Cliente HTTP para la API |
| Dexie 4 | Almacenamiento local en IndexedDB (modo offline) |
| vite-plugin-pwa + Workbox | PWA instalable y service worker |
| lucide-react | Iconografía |
| recharts 3 | Gráficos y analíticas |
| react-day-picker 10 | Selector de fechas |
| class-variance-authority + `cn` | Variantes de componentes y combinación de clases Tailwind |
| oxlint 1 | Linter de código |

---

## Consumo de la API (por dominio de módulos)

El cliente consume la API de Django REST Framework a través de `src/services/api.js` con **axios**. La URL base se define en `.env.local` (`VITE_API_URL`) y en desarrollo Vite reenvía las peticiones al mismo dominio para evitar problemas de CORS.

| Módulo / Dominio | Endpoints principales | Qué gestiona |
|---|---|---|
| `/accounts/` | `POST /login/`, `POST /register/`, `POST /token/refresh/`, `GET /profile/` | Autenticación JWT y sesión de usuario. |
| `/farms/` | `GET/POST/PATCH /farms/`, `GET/POST/PATCH /farms/lots/` | Fincas y lotes. |
| `/labor/` | `GET/POST/PATCH /labor/workers/`, `GET/POST/PATCH /labor/activity-types/`, `POST /labor/workdays/`, `POST /labor/workday-workers/`, `POST /labor/workday-details/`, `POST /labor/harvest-records/` | Trabajadores, tipos de actividad, jornadas, participaciones, detalles de lote y pesajes. |
| `/payroll/` | `GET/POST /payroll/settlements/`, `.../settlement-workdays/`, `.../settlement-harvests/`, `.../payments/`, `POST /payroll/settlements/pay/` | Liquidaciones y pagos laborales (por jornal y por kilogramo). |
| `/finance/` | `GET/POST /finance/expenses/`, `.../sales/` | Gastos y ventas financieras. |
| `/analytics/` | `GET /analytics/summary/` | Resumen analítico (con cálculo local si no hay conexión). |
| `/assistant/` | `POST /assistant/ask/` | Asistente IA. |
| `/sync/` | `POST /sync/push/`, `GET /sync/pull/`, `GET /sync/ping/` | Sincronización offline (cola de operaciones, descarga de datos, sonda de conexión). |

Todas las peticiones protegidas incluyen el token de acceso. Si expira, se intenta renovar automáticamente con el refresh token antes de fallar.

---

## Modo offline — cómo funciona y cada cuánto se sincroniza

CafeSmart está diseñado para usarse en zonas con señal intermitente (por ejemplo, fincas con Wi-Fi sin internet o datos débiles).

### Almacenamiento local
Los datos se guardan en **IndexedDB mediante Dexie** (`src/lib/db.js`) con tres tablas:
- `cache`: última copia de cada lista del servidor (fincas, lotes, trabajadores, jornadas, liquidaciones, pagos, etc.).
- `outbox`: operaciones registradas sin conexión, en el orden en que se hicieron (cola de sincronización).
- `meta`: datos de control, como la fecha de la última sincronización exitosa.

### Flujo sin conexión
1. **Lectura:** si no hay internet (o el servidor no responde), la app responde al instante desde la copia local de IndexedDB. Las listas se muestran con `cachedList`: espera al servidor hasta 1 segundo; si tarda más, muestra la copia local y actualiza en segundo plano.
2. **Escritura:** al crear o editar algo sin conexión, la operación se guarda en la cola (`outbox`) con un `op_id` y UUID generados en el dispositivo, y se aplica de forma optimista en la caché local para que el usuario vea el cambio inmediatamente.
3. **Detección de señal:** la app no solo usa `navigator.onLine` (que solo dice si hay red local), sino que hace una sonda liviana (`GET /sync/ping/`) para saber si el servidor realmente responde. Si el servidor cae, se marca como "no disponible" y todo responde desde el dispositivo. La sonda se repite **cada 10 segundos** hasta que el servidor vuelve.

### Sincronización automática
La sincronización se dispara en estos momentos:
- **Al abrir la app** y al recuperar la visibilidad de la pestaña.
- **Al reconectar a internet** (evento `online` y sonda de servidor).
- **Tras registrar un cambio con conexión:** se programa un envío en **1,5 segundos**.
- **Cada 60 segundos** (`AUTO_SYNC_MS`) si hay conexión y hay operaciones pendientes en la cola.

### Sincronización manual y por lotes
Cuando hay conexión, se ejecuta `syncNow()`:
1. **Push:** envía las operaciones pendientes al servidor en lotes de **50** (`POST /sync/push/`). Los resultados exitosos se marcan como sincronizados y se borran de la cola; los rechazados se guardan con su error para revisión.
2. **Pull:** si no quedan operaciones pendientes, descarga los datos del servidor (`GET /sync/pull/`) y actualiza la caché local. Guarda la fecha de la última sincronización.

### Rutas clave de sincronización
| Ruta | Método | Propósito |
|---|---|---|
| `GET /sync/ping/` | GET | Sonda de conexión del servidor (cada 10 s si hay problemas). |
| `POST /sync/push/` | POST | Envía la cola de operaciones pendientes (lotes de 50). |
| `GET /sync/pull/` | GET | Descarga datos del servidor para actualizar la caché local. |

### PWA
Configurada con `vite-plugin-pwa` y Workbox: precachea todo el build (JS, CSS, HTML, imágenes, fuentes) para que la app abra sin internet, y usa navigate fallback a `/index.html` para que las rutas de React Router funcionen offline.

---

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor local de Vite. |
| `npm run dev:cloud` | Inicia Vite con `BACKEND_URL` para pruebas en la nube. |
| `npm run build` | Genera la compilación de producción en `dist/`. |
| `npm run preview` | Previsualiza la compilación de producción. |
| `npm run lint` | Ejecuta Oxlint. |

---

## Requisitos previos

- Node.js 22 o superior.
- Backend Django REST Framework ejecutándose (local en `http://127.0.0.1:8000` o instancia remota definida en `VITE_API_URL`).