import { Navigate } from 'react-router-dom';

export function AuthenticatedRoute({ usuario, children }) {
  if (!usuario) {
    return <Navigate replace to="/login" />;
  }

  if (usuario.primerIngreso) {
    return <Navigate replace to="/configuracion-inicial" />;
  }

  return children;
}

export function SetupRoute({ usuario, children }) {
  if (!usuario) {
    return <Navigate replace to="/login" />;
  }

  if (!usuario.primerIngreso) {
    return <Navigate replace to="/inicio" />;
  }

  return children;
}
