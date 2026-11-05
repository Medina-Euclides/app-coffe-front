/**
 * Cabecera de sección: título, id para accesibilidad y descripción opcional.
 */
export default function SectionHeader({
  title,
  description,
  headingId,
  headingLevel = 'h2',
}) {
  const Heading = headingLevel === 'h1' ? 'h1' : 'h2';

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div>
        <Heading
          className="text-xl font-semibold tracking-tight text-slate-900"
          id={headingId}
        >
          {title}
        </Heading>
        {description && (
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        )}
      </div>
    </section>
  );
}
