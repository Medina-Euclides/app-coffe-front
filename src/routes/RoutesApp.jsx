import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import { AuthenticatedRoute, SetupRoute } from './RouteGuards.jsx';

const Auth = lazy(() => import('../views/Auth.jsx'));
const Finanzas = lazy(() => import('../modules/finanzas/Finanzas.jsx'));
const Fincas = lazy(() => import('../modules/fincas/Fincas.jsx'));
const Inventario = lazy(() => import('../modules/inventario/Inventario.jsx'));
const Operations = lazy(() => import('../views/Operations.jsx'));
const Personal = lazy(() => import('../modules/personal/Personal.jsx'));
const Workers = lazy(() => import('../views/Workers.jsx'));
const LaborActivities = lazy(() => import('../views/LaborActivities.jsx'));
const FarmsAndLots = lazy(() => import('../views/FarmsAndLots.jsx'));
const SetupWizard = lazy(() =>
  import('../views/SetupWizard.jsx').then((module) => ({
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
          <Route element={<Operations usuario={usuario} />} path="/inicio" />
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
          <Route element={<Inventario usuario={usuario} />} path="/inventario" />
          <Route
            element={<Finanzas subSeccion="finanzas-indicadores" usuario={usuario} />}
            path="/finanzas"
          />
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
          <Route
            element={<Finanzas subSeccion="nuevo-gasto" usuario={usuario} />}
            path="/finanzas/registrar-egreso"
          />
          <Route
            element={<Finanzas subSeccion="nuevo-ingreso" usuario={usuario} />}
            path="/finanzas/registrar-venta"
          />
          <Route element={<Navigate replace to="/inicio" />} path="*" />
        </Route>
      </Routes>
    </Suspense>
  );
}
