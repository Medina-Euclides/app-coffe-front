// Pagar una liquidación desde su detalle: abre el modal, valida y registra el pago.
// Una sola operación atómica (crear/completar la liquidación, cerrarla y pagarla);
// sin conexión queda en la cola y se aplica igual al sincronizar.
import { useState } from 'react';
import { api } from '#services/api';
import { buildSettleAndPay, getPaymentBlocker } from '#lib/domain/payments';

export function usePaySettlement({ onPaid, onFailed }) {
  const [target, setTarget] = useState(null);
  const [payingId, setPayingId] = useState('');
  const [error, setError] = useState('');

  const open = (settlement) => {
    setError('');
    setTarget(settlement);
  };
  const close = () => setTarget(null);

  const pay = async () => {
    if (!target || payingId) return;
    const blocker = getPaymentBlocker(target);
    if (blocker) {
      setError(blocker);
      setTarget(null);
      return;
    }

    setPayingId(target.id);
    setError('');
    try {
      await api.payroll.settleAndPay(buildSettleAndPay(target));
      setTarget(null);
      onPaid?.();
    } catch (payError) {
      console.error('Error al registrar el pago laboral:', payError);
      setError(
        payError.message ||
          'No se pudo completar el pago. Actualiza la lista antes de volver a intentarlo.',
      );
      setTarget(null);
      onFailed?.();
    } finally {
      setPayingId('');
    }
  };

  return { target, open, close, pay, paying: Boolean(payingId), error };
}
