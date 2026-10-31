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
