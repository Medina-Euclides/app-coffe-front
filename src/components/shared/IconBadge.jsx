// Círculo de identidad de las tarjetas: un ícono o unas iniciales.
// Un solo tamaño en toda la app (48 px, ícono de 24 px) para que todo se lea igual.
import { createElement } from 'react';
import { getInitials } from '#lib/formatters';

const tones = {
  primary: 'bg-secondary text-primary',
  harvest: 'bg-cereza-soft text-cereza',
  income: 'bg-leaf-soft text-leaf',
  expense: 'bg-destructive-soft text-destructive',
  muted: 'bg-muted text-subtle',
};

export default function IconBadge({ icon, name, tone = 'primary', online = false }) {
  return (
    <span aria-hidden="true" className="relative shrink-0">
      <span
        className={`flex size-12 items-center justify-center rounded-full font-heading text-base font-bold ${tones[tone]}`}
      >
        {icon ? createElement(icon, { className: 'size-6', strokeWidth: 1.75 }) : getInitials(name)}
      </span>
      {online && (
        <span className="absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-card bg-leaf" />
      )}
    </span>
  );
}
