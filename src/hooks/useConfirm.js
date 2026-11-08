// Confirmación en modal en lugar de window.confirm (que en el celular sale con el
// estilo del sistema y es fácil de aceptar sin leer).
//
//   const confirmer = useConfirm();
//   if (!(await confirmer.confirm({ title: '¿Cerrar la jornada?', confirmLabel: 'Cerrar' }))) return;
//   …
//   <ConfirmDialog {...confirmer.dialogProps} />
import { useCallback, useRef, useState } from 'react';

export function useConfirm() {
  const [request, setRequest] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolveRef.current?.(false);
        resolveRef.current = resolve;
        setRequest(options);
      }),
    [],
  );

  const settle = useCallback((value) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setRequest(null);
  }, []);

  return {
    confirm,
    dialogProps: {
      open: Boolean(request),
      ...request,
      onConfirm: () => settle(true),
      onCancel: () => settle(false),
    },
  };
}
