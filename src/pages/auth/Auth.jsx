// Página de autenticación: gestiona login y registro de usuarios.
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
import { FormAlert, FormField } from '#components/shared/FormFeedback';
import { useFormFeedback } from '#hooks/useFormFeedback';
import { api } from '#services/api';
import MaduracionStripe from '#components/shared/MaduracionStripe';

export function AuthField({
  autoComplete,
  error,
  hint,
  id,
  invalid,
  label,
  minLength,
  name,
  onChange,
  placeholder,
  required = true,
  requiredMessage,
  spellCheck,
  type,
  value,
}) {
  return (
    <FormField
      error={error}
      hint={hint}
      htmlFor={id}
      invalid={invalid}
      label={label}
      labelClassName="font-medium text-foreground"
    >
      <Input
        autoComplete={autoComplete}
        className="h-12 rounded-xl bg-background px-4"
        data-required-message={requiredMessage}
        id={id}
        minLength={minLength}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        spellCheck={spellCheck}
        type={type}
        value={value}
      />
    </FormField>
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
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const feedback = useFormFeedback();
  const [cargando, setCargando] = useState(false);

  const manejarAutenticacion = async (e) => {
    e.preventDefault();
    feedback.clearFormError();
    setCargando(true);

    try {
      if (esRegistro) {
        const datosRegistro = {
          first_name: nombre.trim(),
          last_name: apellido.trim(),
          email: correo.trim(),
          phone_number: telefono.trim(),
          password,
        };
        await api.auth.registro(datosRegistro);

        const sesion = await api.auth.login({
          email: datosRegistro.email,
          password,
        });
        onLogin({ ...sesion.user, primerIngreso: true });
      } else {
        const sesion = await api.auth.login({
          email: correo.trim(),
          password,
        });
        onLogin(sesion.user);
      }
    } catch (authError) {
      console.error('Error en autenticación:', authError);
      feedback.setFormError(
        authError.message ||
          (esRegistro
            ? 'No se pudo crear la cuenta. Revisa tu conexión e inténtalo de nuevo.'
            : 'No se pudo iniciar sesión. Revisa tu conexión e inténtalo de nuevo.'),
      );
    } finally {
      setCargando(false);
    }
  };

  const alternarModo = () => {
    const nuevoModo = !esRegistro;
    setEsRegistro(nuevoModo);
    feedback.reset();
    onModeChange?.(nuevoModo);
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md gap-0 overflow-hidden rounded-2xl border border-border bg-card py-0 shadow-[0_24px_48px_-32px_rgb(21_40_30/0.35)]">
        <MaduracionStripe />
        <CardHeader className="items-center gap-4 px-6 pt-8 text-center sm:px-8 sm:pt-10">
          <img
            alt="Logo de CafeSmart"
            className="size-14 justify-self-center rounded-2xl shadow-sm"
            height={56}
            src="/icon.png"
            width={56}
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary" translate="no">
              CafeSmart
            </p>
            <h1 className="text-4xl text-foreground sm:text-5xl">
              {esRegistro ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
            </h1>
            <CardDescription className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {esRegistro
                ? 'Regístrate para empezar a gestionar tu producción de café.'
                : 'Inicia sesión para continuar con la gestión de tu finca.'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pt-8 sm:px-8">
          <form
            className="space-y-5"
            {...feedback.formProps}
            onSubmit={manejarAutenticacion}
          >
            {esRegistro && (
              <AuthField
                autoComplete="name"
                {...feedback.field('nombre')}
                requiredMessage="Escribe tu nombre."
                id="nombre"
                label="Nombre"
                name="first_name"
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej.: Juan…"
                type="text"
                value={nombre}
              />
            )}

            {esRegistro && (
              <AuthField
                autoComplete="family-name"
                {...feedback.field('apellido')}
                requiredMessage="Escribe tu apellido."
                id="apellido"
                label="Apellido"
                name="last_name"
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Ej.: Pérez…"
                type="text"
                value={apellido}
              />
            )}

            {esRegistro && (
              <AuthField
                autoComplete="tel"
                {...feedback.field('telefono')}
                id="telefono"
                label="Teléfono (opcional)"
                name="phone_number"
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej.: 3001234567"
                required={false}
                type="tel"
                value={telefono}
              />
            )}

            <AuthField
              autoComplete="email"
              {...feedback.field('correo')}
              requiredMessage="Escribe tu correo electrónico."
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
              {...feedback.field('contrasena')}
              requiredMessage="Escribe tu contraseña."
              id="contrasena"
              label="Contraseña"
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              hint={esRegistro ? 'Usa al menos 8 caracteres.' : undefined}
              minLength={esRegistro ? 8 : undefined}
              placeholder="Ingresa tu contraseña…"
              type="password"
              value={password}
            />

            <FormAlert message={feedback.formError} onDismiss={feedback.clearFormError} />

            <Button
              className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary-hover"
              disabled={cargando}
              type="submit"
            >
              {cargando
                ? 'Conectando…'
                : esRegistro
                  ? 'Crear cuenta'
                  : 'Iniciar sesión'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="mt-7 flex-wrap justify-center gap-1 border-t border-border px-6 py-5 text-center sm:px-8">
          <span className="text-sm text-muted-foreground">
            {esRegistro ? '¿Ya tienes una cuenta?' : '¿Aún no tienes una cuenta?'}
          </span>
          <Button
            className="h-auto px-1 py-1 text-sm font-semibold text-primary hover:text-foreground"
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
