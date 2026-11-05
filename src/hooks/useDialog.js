// Maneja la apertura y cierre de un diálogo con un elemento opcional seleccionado.
import { useState } from 'react';

export function useDialog() {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(null);

  const openWith = (newItem) => {
    setItem(newItem);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setItem(null);
  };

  return { open, item, setOpen, setItem, openWith, close };
}
