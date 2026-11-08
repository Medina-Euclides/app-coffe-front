// Muestra la respuesta del asistente con el formato básico que suele traer
// (párrafos, **negrita**, *énfasis* y listas con «-» o «1.»), sin asteriscos
// sueltos. Se arma con elementos de React: nunca se inserta HTML del servidor.
const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;

function renderInline(text, keyPrefix) {
  return text.split(INLINE).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong className="font-semibold text-foreground" key={key}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

const BULLET = /^\s*[-•*]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

export default function AnswerText({ text }) {
  const blocks = text.trim().split(/\n{2,}/);

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').filter((line) => line.trim());
        const key = `b${blockIndex}`;
        if (lines.length && lines.every((line) => BULLET.test(line))) {
          return (
            <ul className="list-disc space-y-1 pl-5 marker:text-primary" key={key}>
              {lines.map((line, index) => (
                <li key={index}>{renderInline(line.replace(BULLET, ''), `${key}-${index}`)}</li>
              ))}
            </ul>
          );
        }
        if (lines.length && lines.every((line) => NUMBERED.test(line))) {
          return (
            <ol className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-primary" key={key}>
              {lines.map((line, index) => (
                <li key={index}>{renderInline(line.replace(NUMBERED, ''), `${key}-${index}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p className="whitespace-pre-wrap" key={key}>
            {renderInline(lines.join('\n'), key)}
          </p>
        );
      })}
    </div>
  );
}
