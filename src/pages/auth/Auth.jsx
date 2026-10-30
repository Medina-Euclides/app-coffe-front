import { useState } from 'react';
import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '#components/ui/card';
import { Input } from '#components/ui/input';

export function AuthField({
  autoComplete,
  id,
  label,
  name,
  onChange,
  placeholder,
  spellCheck,
  type,
  value,
}) {
  return (
    <div className="space-y-2">
      <label className="auth-field-label text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <Input
        autoComplete={autoComplete}
        className="h-12 rounded-xl bg-background px-4"
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required
        spellCheck={spellCheck}
        type={type}
        value={value}
      />
    </div>
  );
}

export default function Auth({
  initialMode = 'login',
  onLogin,
  onModeChange,
}) {
  const [esRegistro, setEsRegistro] = useState(initialMode === 'register');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [nombreProductor, setNombreProductor] = useState('');
  const [error, setError] = useState('');

  const manejarAutenticacion = (e) => {
    e.preventDefault();
    setError('');

    try {
      const usuariosGuardados = JSON.parse(localStorage.getItem('cafesmart_usuarios')) || [];

      if (esRegistro) {
        const existe = usuariosGuardados.find((u) => u.correo === correo);
        if (existe) {
          setError('El correo ya se encuentra registrado. Inicia sesión o usa otro correo.');
          return;
        }

        const nuevoUsuario = {
          id: Date.now(),
          correo,
          password,
          nombreProductor: nombreProductor || 'Productor',
          primerIngreso: true,
        };

        usuariosGuardados.push(nuevoUsuario);
        localStorage.setItem('cafesmart_usuarios', JSON.stringify(usuariosGuardados));

        onLogin(nuevoUsuario);
      } else {
        const usuarioEncontrado = usuariosGuardados.find(
          (u) => u.correo === correo && u.password === password,
        );
        if (usuarioEncontrado) {
          onLogin(usuarioEncontrado);
        } else {
          setError('Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.');
        }
      }
    } catch (e) {
      console.error('Error en autenticación:', e);
      setError('No se pudo completar la autenticación. Inténtalo de nuevo.');
    }
  };

  const alternarModo = () => {
    const nuevoModo = !esRegistro;
    setEsRegistro(nuevoModo);
    setError('');
    onModeChange?.(nuevoModo);
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50 px-4 py-10">
      <Card className="w-full max-w-md gap-0 rounded-3xl border border-emerald-950/10 bg-white/95 py-0 shadow-xl shadow-emerald-950/10 backdrop-blur">
        <CardHeader className="items-center gap-4 px-6 pt-8 text-center sm:px-8 sm:pt-10">
          <img
            alt="Logo de CafeSmart"
            className="size-14 justify-self-center rounded-2xl shadow-sm"
            height={56}
            src="/icon.png"
            width={56}
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold tracking-wide text-emerald-800" translate="no">
              CafeSmart
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {esRegistro ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
            </h1>
            <CardDescription className="text-pretty text-sm leading-relaxed text-slate-600">
              {esRegistro
                ? 'Regístrate para empezar a gestionar tu producción de café.'
                : 'Inicia sesión para continuar con la gestión de tu finca.'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pt-8 sm:px-8">
          <form className="space-y-5" onSubmit={manejarAutenticacion}>
            {esRegistro && (
              <AuthField
                autoComplete="name"
                id="nombre-productor"
                label="Nombre completo"
                name="name"
                onChange={(e) => setNombreProductor(e.target.value)}
                placeholder="Ej.: Juan Pérez…"
                type="text"
                value={nombreProductor}
              />
            )}

            <AuthField
              autoComplete="email"
              id="correo"
              label="Correo electrónico"
              name="email"
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ej.: productor@cafesmart.com…"
              spellCheck={false}
              type="email"
              value={correo}
            />

            <AuthField
              autoComplete={esRegistro ? 'new-password' : 'current-password'}
              id="contrasena"
              label="Contraseña"
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña…"
              type="password"
              value={password}
            />

            {error && (
              <p
                aria-live="polite"
                className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}

            <Button
              className="h-12 w-full rounded-xl bg-emerald-800 text-base font-semibold text-white shadow-sm hover:bg-emerald-900"
              type="submit"
            >
              {esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="mt-7 flex-wrap justify-center gap-1 border-t border-emerald-950/10 px-6 py-5 text-center sm:px-8">
          <span className="text-sm text-slate-600">
            {esRegistro ? '¿Ya tienes una cuenta?' : '¿Aún no tienes una cuenta?'}
          </span>
          <Button
            className="h-auto px-1 py-1 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
            onClick={alternarModo}
            type="button"
            variant="link"
          >
            {esRegistro ? 'Inicia sesión' : 'Regístrate'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
