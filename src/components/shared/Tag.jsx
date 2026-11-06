// Etiqueta corta de estado o modalidad (Inactivo, Jornal, Por kilo…).
const tones = {
  neutral: 'bg-muted text-muted-foreground',
  leaf: 'bg-leaf-soft text-leaf',
  harvest: 'bg-cereza-soft text-cereza',
};

export default function Tag({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
