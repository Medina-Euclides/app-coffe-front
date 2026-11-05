// Maneja un mensaje de aviso temporal (éxito o error) para mostrar en pantalla.
import { useState } from 'react';

export function useNotice() {
  const [notice, setNotice] = useState('');
  const [isError, setIsError] = useState(false);

  const show = (message, error = false) => {
    setNotice(message);
    setIsError(error);
  };

  const clear = () => {
    setNotice('');
    setIsError(false);
  };

  return { notice, isError, show, clear };
}
