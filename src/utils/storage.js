/**
 * Manejo centralizado y seguro de almacenamiento en localStorage
 */

export const leerLocal = (clave, valorInicial) => {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado === null ? valorInicial : JSON.parse(guardado);
  } catch (error) {
    console.error(`Error al leer clave "${clave}" de localStorage:`, error);
    return valorInicial;
  }
};

export const guardarLocal = (clave, valor) => {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    console.error(`Error al guardar clave "${clave}" en localStorage:`, error);
  }
};
