import { useState } from 'react';

export default function Auth({ onLogin }) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [nombreProductor, setNombreProductor] = useState('');

  const manejarAutenticacion = (e) => {
    e.preventDefault();
    if (!correo || !password) return;

    try {
      const usuariosGuardados = JSON.parse(localStorage.getItem('cafesmart_usuarios')) || [];

      if (esRegistro) {
        const existe = usuariosGuardados.find(u => u.correo === correo);
        if (existe) {
          alert('El correo ya se encuentra registrado.');
          return;
        }

        const nuevoUsuario = {
          id: Date.now(),
          correo,
          password,
          nombreProductor: nombreProductor || 'Productor',
          primerIngreso: true
        };

        usuariosGuardados.push(nuevoUsuario);
        localStorage.setItem('cafesmart_usuarios', JSON.stringify(usuariosGuardados));

        onLogin(nuevoUsuario);
      } else {
        const usuarioEncontrado = usuariosGuardados.find(u => u.correo === correo && u.password === password);
        if (usuarioEncontrado) {
          onLogin(usuarioEncontrado);
        } else {
          alert('Credenciales incorrectas. Verifique correo y contraseña.');
        }
      }
    } catch (e) {
      console.error('Error en autenticación:', e);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '24px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      
      {/* ENCABEZADO CON LOGO Y NOMBRE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
        <img 
          src="/icon.png" 
          alt="Logo CafeSmart" 
          style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }} 
        />
        <h1 style={{ color: '#064e3b', margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>CafeSmart</h1>
      </div>

      <h3 style={{ textAlign: 'center', color: '#334155', marginBottom: '20px' }}>
        {esRegistro ? 'Crear Cuenta de Productor' : 'Iniciar Sesión'}
      </h3>

      <form onSubmit={manejarAutenticacion}>
        {esRegistro && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>Nombre Completo:</label>
            <input 
              type="text" 
              placeholder="Ej: Juan Pérez" 
              value={nombreProductor} 
              onChange={e => setNombreProductor(e.target.value)} 
              required 
              style={{ width: '100%', minHeight: '48px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1' }} 
            />
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>Correo Electrónico:</label>
          <input 
            type="email" 
            placeholder="productor@cafesmart.com" 
            value={correo} 
            onChange={e => setCorreo(e.target.value)} 
            required 
            style={{ width: '100%', minHeight: '48px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1' }} 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>Contraseña:</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', minHeight: '48px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1' }} 
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', minHeight: '50px', fontSize: '1rem', fontWeight: 'bold' }}>
          {esRegistro ? 'Crear Cuenta' : 'Ingresar'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          onClick={() => setEsRegistro(!esRegistro)} 
          style={{ background: 'none', border: 'none', color: '#047857', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          {esRegistro ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate aquí'}
        </button>
      </div>
    </div>
  );
}