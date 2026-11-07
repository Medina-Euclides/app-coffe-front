import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '#components/layout/AppLayout';
import { AuthenticatedRoute, SetupRoute } from './RouteGuards.jsx';

const Auth = lazy(() => import('#pages/auth/Auth.jsx'));
const SetupWizard = lazy(() =>
  import('#pages/configuracion/SetupWizard.jsx').then((module) => ({
    default: module.SetupWizard,
  })),
);
const OperationsHome = lazy(() =>
  import('#pages/inicio/Inicio.jsx'),
);

const Workers = lazy(() => import('#pages/trabajadores/Trabajadores.jsx'));
const LaborActivities = lazy(() =>
  import('#pages/actividades/ActividadesLaborales.jsx'),
);
const FarmsAndLots = lazy(() =>
  import('#pages/fincas/FarmsAndLots.jsx'),
);

const WorkdayPage = lazy(() => import('#pages/workday/WorkdayPage.jsx'));
const PaymentPage = lazy(() => import('#pages/payment/PaymentPage.jsx'));
const FinanceActivityPage = lazy(() => import('#pages/finance/FinanceActivityPage.jsx'));
const AnalyticPage = lazy(() => import('#pages/analytics/AnalyticPage.jsx'));
const AssistantPage = lazy(() => import('#pages/assistant/AssistantPage.jsx'));


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
        <p aria-live="polite" className="p-6 text-sm text-muted-foreground" role="status">
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
            element={<Navigate replace to="/gestion/fincas" />}
            path="/fincas"
          />

          <Route
            element={<WorkdayPage  usuario={usuario} />}
            path="/jornada-laboral"
          />

          <Route
            element={<PaymentPage  usuario={usuario} />}
            path="/pagos-laborales"
          />

          <Route
            element={<FinanceActivityPage  usuario={usuario} />}
            path="/movimientos-financieros"
          />

          <Route
            element={<AnalyticPage  usuario={usuario} />}
            path="/analitica"
          />

          <Route
            element={<AssistantPage  usuario={usuario} />}
            path="/asistente-ia"
          />

          <Route element={<Navigate replace to="/inicio" />} path="*" />
        </Route>
      </Routes>
    </Suspense>
  );
}
