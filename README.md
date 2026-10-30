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
│   ├── finanzas/
│   ├── personal/
│   ├── inventario/
│   ├── auth/
│   ├── configuracion/
│   └── asistente/
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
