# CafeSmart Frontend

Interfaz web construida con React y Vite.

## Estructura de `src`

```text
src/
├── App.jsx
├── main.jsx
├── index.css
├── components/
│   ├── ui/          # Componentes shadcn/ui; mantenerlos independientes de las pantallas
│   ├── layout/      # Estructura y navegación global
│   └── shared/      # Componentes compartidos entre áreas
├── pages/
│   ├── inicio/
│   ├── trabajadores/
│   ├── actividades/
│   ├── fincas/
│   ├── operaciones/
│   ├── personal/
│   ├── inventario/
│   ├── auth/
│   └── configuracion/
├── routes/          # Definición de rutas y guardas de acceso
├── lib/             # Utilidades, formato, almacenamiento y constantes
├── hooks/           # Hooks reutilizables globales
└── services/        # API y sincronización
```

Cada carpeta dentro de `pages/` contiene las pantallas de esa área y, cuando aplica,
su propia carpeta `components/`. Mantén ahí los componentes de uso local; comparte
componentes entre áreas desde `components/shared/`. Los componentes base de shadcn
permanecen en `components/ui/`.

## Comandos

- `npm run dev`: inicia el servidor local de Vite.
- `npm run build`: genera la compilación de producción.
- `npm run lint`: ejecuta Oxlint.

## Conexión con Django REST Framework

El cliente consume la API local en `http://127.0.0.1:8000` de forma predeterminada.
Para usar otra instancia, define `VITE_API_URL` en un archivo `.env.local`, por
ejemplo:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Inicia Django con `python manage.py runserver` y React con `npm run dev`. El
inicio de sesión usa `POST /accounts/login/`; el registro envía
`first_name`, `last_name`, `email`, `phone_number` y `password` a
`POST /accounts/register/`. Después de registrarse, el cliente inicia sesión
para obtener los tokens JWT. Conserva los tokens en el navegador y envía el
token de acceso como `Authorization: Bearer <access>` en las peticiones
protegidas. La API local debe permitir CORS desde el origen de Vite
(`http://localhost:5173`).

La gestión de fincas y lotes consume `GET`/`POST`/`PATCH /farms/` y
`GET`/`POST`/`PATCH /farms/lots/`. El cliente envía los nombres del modelo DRF:
`name`, `location`, `description`, `id_farm`, `coffee_variety`,
`area_hectares` e `is_active`. Los formularios convierten las respuestas al
formato que usan las pantallas actuales y guardan una copia local para los
módulos que todavía leen fincas y lotes desde el almacenamiento del navegador.

La gestión de trabajadores consume `GET`/`POST /labor/workers/` y
`PATCH /labor/workers/{id}/` con los campos `first_name`, `last_name`,
`identification`, `phone` e `is_active`. La identificación y el teléfono son
opcionales según el modelo. El cliente conserva una copia local para su
consulta y usa la desactivación/reactivación para preservar el historial de
jornadas; no ofrece borrado físico desde la interfaz.

La gestión de tipos de actividad consume el CRUD de
`/labor/activity-types/` con los campos `name`, `description` e `is_harvest`.
Este último indica si la actividad admite pago por kilogramo y también se usa
al asignar labores desde Personal. El cliente conserva una copia local para
consulta, pero los cambios requieren conexión; el servidor impide borrar
actividades asociadas a jornadas existentes.

Las jornadas usan el modelo relacional del backend: se crea una jornada con
`farm` y `date` en `/labor/workdays/`, luego una participación por trabajador
en `/labor/workday-workers/` con `workday`, `worker`, `payment_mode` y
`agreed_rate`, y un detalle por cada lote en `/labor/workday-details/` con
`workday_worker`, `activity_type` y `lot`. El formulario permite seleccionar
varios trabajadores y varios lotes de una misma finca; aplica la misma
actividad y tarifa a las participaciones de esa jornada. La consulta de
jornadas recibe las participaciones y sus detalles anidados. En jornadas
abiertas se pueden agregar trabajadores mediante nuevas participaciones y
detalles, retirar una participación pendiente con
`POST /labor/workday-workers/{id}/cancel/` y cerrar la jornada con
`POST /labor/workdays/{id}/close/`. Una jornada cerrada no permite agregar o
modificar registros. Desde una jornada abierta, `PATCH /labor/workdays/{id}/labor/`
actualiza actividad, modalidad y tarifa para todas las participaciones
no anuladas y sus detalles; el cambio se rechaza si hay participaciones
bloqueadas o es incompatible con pesajes.
Una participación retirada puede volver a agregarse en la misma jornada
mediante `POST /labor/workday-workers/{id}/reactivate/`, siempre que el
trabajador siga activo y la jornada continúe abierta.

El formulario de pesajes consulta las jornadas abiertas y sus detalles
anidados, muestra primero las jornadas que tienen una actividad marcada como
`is_harvest`, y permite seleccionar dentro de ellas un trabajador y su lote.
El selector de lotes muestra todos los lotes activos de la finca de la
jornada. Si el trabajador aún no tiene un detalle para el lote elegido, el
cliente crea uno con una actividad de recolección de la jornada antes de enviar
`workday_detail`, `quantity_kg` y `time` a `POST /labor/harvest-records/`; el
servidor valida que el detalle sea de recolección y que la jornada y la
participación sigan abiertas.

La página de pagos laborales consulta `/payroll/settlements/`,
`/payroll/settlement-workdays/`, `/payroll/settlement-harvests/` y
`/payroll/payments/`, junto con jornadas, trabajadores y fincas para completar
los detalles legibles. En pendientes muestra liquidaciones abiertas o
liquidadas y también calcula registros aún no incluidos en una liquidación,
siempre que pertenezcan a jornadas cerradas: participaciones por jornal y
pesajes registrados por kilogramo. Las liquidaciones pagadas aparecen en la
pestaña correspondiente. Ambas pestañas comparten filtros por período,
modalidad y búsqueda. Al confirmar el botón **Pagar**, se selecciona el método,
se crea o completa y cierra la liquidación si hace falta, y se registra el
pago por `/payroll/settlements/pay/`; después se recarga la lista en la pestaña
de pagos realizados. La finca de una liquidación nueva se toma del campo de
finca de la jornada cerrada; no se solicita al usuario de nuevo. Si la jornada
no incluye un identificador de finca, el pago se detiene y se informa el
problema en lugar de enviar una liquidación inválida. Las tarjetas pagadas
muestran el botón desactivado.
