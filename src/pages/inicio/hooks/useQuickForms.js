// Formularios rápidos de Inicio (pesaje, jornada, venta, gasto, trabajador): cuál está
// abierto, los datos que necesita cada uno y qué pasa al guardar.
import { useState } from 'react';
import { createWorkdayWithWorkers, toExistingWorkdays } from '#lib/domain/workdayActions';
import { saveWorkerRequest, validateWorker } from '#lib/domain/workers';
import { api } from '#services/api';
import { leerFincaActiva } from '#services/farmStorage';
import { tipoMovimiento } from '../quickForms.js';

// `cargarJornadas` y `cargarOtrosRegistros` refrescan el resumen tras guardar.
export function useQuickForms({ userId, mostrarAviso, cargarJornadas, cargarOtrosRegistros }) {
  const [formulario, setFormulario] = useState('');
  // null hasta que se abre una venta o un gasto por primera vez.
  const [fincas, setFincas] = useState(null);
  const [jornadasExistentes, setJornadasExistentes] = useState([]);
  // Los trabajadores vienen de la caché de IndexedDB (api.workers.list), no de localStorage.
  const [trabajadores, setTrabajadores] = useState([]);

  // Abre el formulario sobre Inicio y trae en segundo plano los datos que necesita
  // para validar duplicados.
  const abrirFormulario = (tipo) => {
    mostrarAviso('');
    setFormulario(tipo);
    if (tipo === 'jornada') {
      api.workdays
        .list()
        .then((items) => setJornadasExistentes(toExistingWorkdays(items)))
        .catch((error) => console.error('Error al cargar jornadas:', error));
    }
    if (tipoMovimiento[tipo] && fincas === null) {
      api.farms
        .list()
        .then(setFincas)
        .catch((error) => {
          console.error('Error al cargar fincas:', error);
          setFormulario('');
          mostrarAviso(
            error.message || 'No se pudieron cargar tus fincas. Inténtalo de nuevo.',
            true,
          );
        });
    }
    if (tipo === 'trabajador') {
      api.workers
        .list()
        .then(setTrabajadores)
        .catch((error) => console.error('Error al cargar trabajadores:', error));
    }
  };

  const cerrar = (open) => {
    if (!open) setFormulario('');
  };

  const guardarJornada = async (payload, context) => {
    await createWorkdayWithWorkers(payload, context);
    mostrarAviso('La jornada laboral se registró correctamente.');
    cargarJornadas();
  };

  const guardarPesaje = () => {
    mostrarAviso('El pesaje de recolección se registró correctamente.');
    cargarJornadas();
  };

  const guardarMovimiento = async (payload) => {
    const esVenta = formulario === 'venta';
    try {
      if (esVenta) await api.production.sales.create(payload);
      else await api.finance.expenses.create(payload);
      mostrarAviso(esVenta ? 'Venta registrada.' : 'Gasto registrado.');
      cargarOtrosRegistros();
      return '';
    } catch (error) {
      console.error('Error al guardar el movimiento:', error);
      return (
        error.message ||
        `No se pudo guardar ${esVenta ? 'la venta' : 'el gasto'}. Revisa tu conexión e inténtalo de nuevo.`
      );
    }
  };

  const guardarTrabajador = async (data) => {
    const errorValidacion = validateWorker(data, trabajadores);
    if (errorValidacion) return errorValidacion;
    try {
      const nuevo = await saveWorkerRequest(data);
      const siguientes = [...trabajadores, nuevo];
      setTrabajadores(siguientes);
      mostrarAviso('Trabajador agregado.');
      cargarOtrosRegistros();
      return '';
    } catch (error) {
      console.error('Error al guardar el trabajador:', error);
      return error.message || 'No se pudo guardar el trabajador. Inténtalo de nuevo.';
    }
  };

  // Solo se preselecciona la finca guardada si sigue existiendo.
  const fincaGuardada = fincas ? leerFincaActiva(userId) : '';
  const fincaActiva = fincas?.some((finca) => String(finca.id) === fincaGuardada)
    ? fincaGuardada
    : '';

  return {
    formulario,
    abrir: abrirFormulario,
    cerrar,
    fincas,
    fincaActiva,
    jornadasExistentes,
    guardarJornada,
    guardarPesaje,
    guardarMovimiento,
    guardarTrabajador,
  };
}
