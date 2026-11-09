// Estado y guardado del asistente de configuración inicial. Lo ya creado (finca, lote,
// actividad, trabajador) se recuerda para que un reintento no lo duplique.
import { useState } from 'react';
import { useFormFeedback } from '#hooks/useFormFeedback';
import { VARIEDADES_CAFE } from '#lib/constants';
import { isValidLotArea, isValidPlantCount } from '#lib/domain/farms';
import { saveWorkerRequest, validateWorker } from '#lib/domain/workers';
import { api } from '#services/api';
import { guardarFincaActiva } from '#services/farmStorage';

const INITIAL_VALUES = {
  nombreFinca: '',
  ubicacion: '',
  nombreLote: '',
  variedad: VARIEDADES_CAFE[0],
  hectareas: '',
  plantas: '',
  nombreActividad: '',
  nombreTrabajador: '',
  apellidoTrabajador: '',
  cedulaTrabajador: '',
};

const toOptionalNumber = (value) => (value === '' ? null : Number(value));

export function useSetupWizard({ usuario, onComplete }) {
  const [paso, setPaso] = useState(1);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [creados, setCreados] = useState({ finca: null, lote: null, actividad: null, trabajador: null });
  const [guardando, setGuardando] = useState(false);
  const feedback = useFormFeedback();

  // setValue('nombreFinca') devuelve el manejador onChange de ese campo.
  const setValue = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));
  const clearValue = (field) => setValues((current) => ({ ...current, [field]: '' }));

  // Cambia de paso limpiando los errores del paso anterior.
  const goTo = (nextPaso) => {
    feedback.reset();
    setPaso(nextPaso);
  };

  const datosTrabajador = () => ({
    first_name: values.nombreTrabajador.trim(),
    last_name: values.apellidoTrabajador.trim(),
    identification: values.cedulaTrabajador.trim(),
    phone: '',
  });

  // Los pasos anteriores ya validan sus campos; esto cubre casos raros
  // (sesión perdida, volver atrás y borrar) con un aviso que dice dónde ir.
  const findError = ({ conTrabajador, area, plantCount }) => {
    if (!usuario?.id) return 'Tu sesión se cerró. Vuelve a iniciar sesión para continuar.';
    if (!values.nombreFinca.trim() || !values.nombreLote.trim()) {
      return 'Falta el nombre de la finca o del lote. Vuelve atrás y complétalo.';
    }
    const actividad = values.nombreActividad.trim();
    if (actividad && actividad.length < 2) {
      return 'El nombre de la actividad es muy corto. Vuelve atrás y usa al menos 2 caracteres.';
    }
    if (!isValidLotArea(area)) {
      return 'El área del lote debe ser mayor que cero. Vuelve atrás para corregirla o déjala vacía.';
    }
    if (!isValidPlantCount(plantCount)) {
      return 'El número de plantas debe ser un número entero. Vuelve atrás para corregirlo.';
    }
    if (conTrabajador) return validateWorker(datosTrabajador(), [], null);
    return '';
  };

  const guardarConfiguracion = async ({ conTrabajador = true } = {}) => {
    feedback.clearFormError();
    const area = toOptionalNumber(values.hectareas);
    const plantCount = toOptionalNumber(values.plantas);
    const error = findError({ conTrabajador, area, plantCount });
    if (error) {
      feedback.setFormError(error);
      return;
    }

    setGuardando(true);
    try {
      const finca =
        creados.finca ||
        (await api.farms.create({
          name: values.nombreFinca.trim(),
          location: values.ubicacion.trim(),
          description: '',
        }));
      setCreados((current) => ({ ...current, finca }));
      const lote =
        creados.lote ||
        (await api.lots.create({
          id_farm: finca.id,
          name: values.nombreLote.trim(),
          coffee_variety: values.variedad,
          area_hectares: area,
          plant_count: plantCount,
          description: '',
        }));
      setCreados((current) => ({ ...current, lote }));
      const actividad =
        creados.actividad ||
        (await api.activities.create({
          name: values.nombreActividad.trim() || 'Recolección de café',
          description: '',
          is_harvest: true,
        }));
      setCreados((current) => ({ ...current, actividad }));
      if (conTrabajador) {
        const trabajador = creados.trabajador || (await saveWorkerRequest(datosTrabajador(), null));
        setCreados((current) => ({ ...current, trabajador }));
      }
      guardarFincaActiva(usuario.id, finca.id);
      onComplete();
    } catch (saveError) {
      console.error('Error al guardar la configuración inicial:', saveError);
      feedback.setFormError(
        saveError.message ||
          'No se pudo guardar la configuración. Revisa tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return {
    paso,
    goTo,
    values,
    setValue,
    clearValue,
    creados,
    guardando,
    feedback,
    guardarConfiguracion,
  };
}
