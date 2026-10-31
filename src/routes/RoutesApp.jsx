import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '#components/layout/AppLayout';
import { AuthenticatedRoute, SetupRoute } from './RouteGuards.jsx';

const Auth = lazy(() => import('#pages/auth/Auth.jsx'));
const Fincas = lazy(() => import('#pages/fincas/Fincas.jsx'));
const Inventario = lazy(() => import('#pages/inventario/Inventario.jsx'));
const Operations = lazy(() => import('#pages/operaciones/Operations.jsx'));
const OperationsHome = lazy(() =>
  import('#pages/inicio/Inicio.jsx'),
);
const Personal = lazy(() => import('#pages/personal/Personal.jsx'));
const Workers = lazy(() => import('#pages/trabajadores/Trabajadores.jsx'));
const LaborActivities = lazy(() =>
  import('#pages/actividades/ActividadesLaborales.jsx'),
);
const FarmsAndLots = lazy(() =>
  import('#pages/fincas/FarmsAndLots.jsx'),
);
const SetupWizard = lazy(() =>
  import('#pages/configuracion/SetupWizard.jsx').then((module) => ({
    default: module.SetupWizard,
  })),
);

export default function RoutesApp({
  usuario,
  onLogin,
  onLogout,
  onModeChange,
  onSetupComplete,
}) {
  const destinoUsuario = usuario?.primerIngreso
    ? '/configuracion-inicial'
    : '/inicio';

  return (
    <Suspense
      fallback={
        <p aria-live="polite" className="p-6 text-sm text-slate-600" role="status">
          Cargando pantalla…
        </p>
      }
    >
      <Routes>
        <Route
          element={<Navigate replace to={usuario ? destinoUsuario : '/login'} />}
          path="/"
        />
        <Route
          element={
            usuario ? (
              <Navigate replace to={destinoUsuario} />
            ) : (
              <Auth
                initialMode="login"
                key="login"
                onLogin={onLogin}
                onModeChange={onModeChange}
              />
            )
          }
          path="/login"
        />
        <Route
          element={
            usuario ? (
              <Navigate replace to={destinoUsuario} />
            ) : (
              <Auth
                initialMode="register"
                key="register"
                onLogin={onLogin}
                onModeChange={onModeChange}
              />
            )
          }
          path="/registro"
        />
        <Route
          element={
            <SetupRoute usuario={usuario}>
              <SetupWizard onComplete={onSetupComplete} usuario={usuario} />
            </SetupRoute>
          }
          path="/configuracion-inicial"
        />
        <Route
          element={
            <AuthenticatedRoute usuario={usuario}>
              <AppLayout onLogout={onLogout} usuario={usuario} />
            </AuthenticatedRoute>
          }
        >
          <Route element={<OperationsHome usuario={usuario} />} path="/inicio" />
          <Route
            element={<Workers usuario={usuario} />}
            path="/gestion/trabajadores"
          />
          <Route
            element={<LaborActivities usuario={usuario} />}
            path="/gestion/actividades"
          />
          <Route
            element={<FarmsAndLots usuario={usuario} />}
            path="/gestion/fincas"
          />
          <Route
            element={<Fincas subSeccion="fincas-lotes" usuario={usuario} />}
            path="/fincas"
          />
          <Route element={<Operations usuario={usuario} />} path="/operaciones" />
          <Route
            element={<Operations usuario={usuario} />}
            path="/operaciones/recoleccion"
          />
          <Route
            element={<Operations usuario={usuario} />}
            path="/operaciones/jornadas"
          />
          <Route element={<Inventario usuario={usuario} />} path="/inventario" />
          <Route
            element={
              <Personal
                actividadInicial="Recolección de café"
                modalidadInicial="recoleccion"
                subSeccion="registrar-labor"
                usuario={usuario}
              />
            }
            path="/operaciones/registrar-recoleccion"
          />
          <Route
            element={
              <Personal
                actividadInicial="Deshierbe / Plateo"
                modalidadInicial="jornal"
                subSeccion="registrar-labor"
                usuario={usuario}
              />
            }
            path="/operaciones/registrar-jornada"
          />
          <Route element={<Navigate replace to="/inicio" />} path="*" />
        </Route>
      </Routes>
    </Suspense>
  );
}
