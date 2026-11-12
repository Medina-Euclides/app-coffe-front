import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Cherry, Leaf, LoaderCircle, Mic, Square, Users, Wallet } from 'lucide-react';
import {
  InputGroup,
  InputGroupButton,
  InputGroupTextarea,
} from '#components/ui/input-group';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
} from '#components/ui/message';
import { api } from '#services/api';
import { useOnlineStatus } from '#hooks/useOnlineStatus';
import IconBadge from '#components/shared/IconBadge';
import { useSpeechDictation } from './hooks/useSpeechDictation.js';
import AnswerText from './components/AnswerText.jsx';
import { formatoHora, getFirstName } from '#lib/formatters';
import { prefersReducedMotion } from '#lib/utils';
import { TEXT_LIMITS } from '#lib/validation';

// Preguntas frecuentes como teclas, con el color de su tema en toda la app
// (recolección = cereza, ingreso = leaf, labor = verde primario).
// `pregunta` es lo que se escribe en la caja al tocar la tecla.
const preguntasSugeridas = [
  {
    label: '¿En qué se fue la plata?',
    detalle: 'Gastos por labor y concepto',
    pregunta: '¿En qué labor se me ha ido más plata este mes?',
    icon: Wallet,
    tone: 'income',
  },
  {
    label: 'Pagos pendientes',
    detalle: 'Cuánto le debes a cada uno',
    pregunta: '¿Cuánto le debo a cada trabajador?',
    icon: Users,
    tone: 'primary',
  },
  {
    label: 'Cosecha por lote',
    detalle: 'Kilos recogidos este mes',
    pregunta: '¿Cuántos kilos he recogido por lote este mes?',
    icon: Cherry,
    tone: 'harvest',
  },
];

// Círculo pequeño de CafeSmart junto a cada respuesta.
function AssistantMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
    >
      <Leaf className="size-[18px]" strokeWidth={2} />
    </span>
  );
}

function AssistantPage({ usuario }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // El asistente usa una API externa: sin conexión no se puede preguntar.
  const isOnline = useOnlineStatus();
  const nombre = getFirstName(usuario);
  const nextMessageId = useRef(0);
  const conversationRef = useRef(null);
  const conversationEndRef = useRef(null);
  const promptRef = useRef(null);
  const dictation = useSpeechDictation({ onText: setPrompt });
  const wasListening = useRef(false);

  // Al terminar de dictar, el foco vuelve a la caja para revisar y enviar.
  useEffect(() => {
    if (wasListening.current && !dictation.listening) promptRef.current?.focus();
    wasListening.current = dictation.listening;
  }, [dictation.listening]);

  useEffect(() => {
    const conversation = conversationRef.current;
    conversation?.scrollTo({
      top: conversation.scrollHeight,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, [isLoading, messages]);

  const enviarPregunta = async (event) => {
    event.preventDefault();
    const question = prompt.trim();
    if (!question || isLoading || !isOnline) return;
    dictation.stop();

    setPrompt('');
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: nextMessageId.current++,
        role: 'user',
        content: question,
        time: formatoHora(new Date()),
      },
    ]);
    setIsLoading(true);

    try {
      const history = messages
        .slice(-8)
        .map(({ role, content }) => ({ role, content }));
      const response = await api.assistant.ask(question, history);
      if (typeof response?.answer !== 'string' || !response.answer.trim()) {
        throw new Error('El servidor no devolvió una respuesta válida.');
      }
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: nextMessageId.current++,
          role: 'assistant',
          content: response.answer.trim(),
          time: formatoHora(new Date()),
        },
      ]);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: nextMessageId.current++,
          role: 'assistant',
          content: `No pude responder en este momento. ${error.message}`,
          time: formatoHora(new Date()),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const seleccionarPregunta = (pregunta) => {
    setPrompt(pregunta);
    promptRef.current?.focus();
  };

  const puedeEnviar = Boolean(prompt.trim()) && !isLoading && isOnline;
  const ayuda =
    dictation.error ||
    (dictation.listening
      ? 'Habla con calma. Toca el cuadrado para terminar.'
      : !isOnline
        ? 'Sin conexión: el asistente necesita internet. El resto de la app sigue funcionando.'
        : 'Tus cédulas y teléfonos nunca salen de la app.');

  return (
    <section
      aria-label="Asistente CafeSmart"
      className="mx-auto flex min-h-0 w-full max-w-3xl flex-col overflow-hidden"
      style={{ height: 'calc(100dvh - 8rem)' }}
    >
      <div
        aria-label="Conversación con CafeSmart"
        aria-live="polite"
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-1 py-4 sm:px-2 sm:py-8"
        ref={conversationRef}
        role="log"
      >
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col justify-center pb-4">
            <div className="flex items-center gap-3">
              <IconBadge icon={Leaf} />
              <h2 className="text-balance text-3xl leading-tight text-foreground sm:text-4xl">
                {nombre ? `Hola, ${nombre}` : 'Hola'}
              </h2>
            </div>
            <p className="mt-3 max-w-md text-pretty text-base leading-6 text-ink-soft">
              Pregúntame en qué se te va la plata, cuánto debes o cómo va la
              cosecha. Puedes escribir o dictar con el micrófono.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {preguntasSugeridas.map(({ label, detalle, pregunta, icon, tone }) => (
                <li key={label}>
                  <button
                    className="flex min-h-18 w-full cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 text-left shadow-[0_3px_0_var(--border-strong)] transition-[background-color,box-shadow,translate] duration-100 hover:bg-tint focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring active:translate-y-[3px] active:shadow-[0_0_0_var(--border-strong)] motion-reduce:transition-none sm:flex-col sm:items-start"
                    onClick={() => seleccionarPregunta(pregunta)}
                    type="button"
                  >
                    <IconBadge icon={icon} tone={tone} />
                    <span className="min-w-0">
                      <span className="block font-heading text-lg font-semibold leading-tight text-foreground">
                        {label}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{detalle}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <MessageGroup className="gap-6">
            {messages.map((message) =>
              message.role === 'user' ? (
                <Message align="end" className="gap-2.5" key={message.id}>
                  <MessageContent className="max-w-[85%] items-end gap-1 sm:max-w-[75%]">
                    <p className="whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-3 text-base leading-6 text-primary-foreground">
                      {message.content}
                    </p>
                    <span className="text-sm text-muted-foreground">{message.time}</span>
                  </MessageContent>
                </Message>
              ) : (
                <Message className="gap-3" key={message.id}>
                  <MessageAvatar className="self-start">
                    <AssistantMark />
                  </MessageAvatar>
                  <MessageContent className="min-w-0 max-w-[90%] gap-1">
                    <div className="break-words rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 text-base leading-6 text-foreground">
                      <AnswerText text={message.content} />
                    </div>
                    <span className="text-sm text-muted-foreground">CafeSmart · {message.time}</span>
                  </MessageContent>
                </Message>
              ),
            )}

            {isLoading && (
              <Message className="gap-3">
                <MessageAvatar className="self-start">
                  <AssistantMark />
                </MessageAvatar>
                <MessageContent className="min-w-0">
                  <div
                    className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 text-base text-muted-foreground"
                    role="status"
                  >
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 text-primary motion-safe:animate-spin"
                    />
                    Pensando…
                  </div>
                </MessageContent>
              </Message>
            )}
          </MessageGroup>
        )}
        <div aria-hidden="true" ref={conversationEndRef} />
      </div>

      <footer className="w-full shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-2 sm:pb-3">
        <form onSubmit={enviarPregunta}>
          {/* has-disabled:* anula el gris y la transparencia que InputGroup pone a todo
              el bloque cuando un botón está desactivado (p. ej. Enviar sin texto). */}
          <InputGroup className="min-h-16 items-end rounded-3xl border-border-strong bg-card p-2 shadow-[0_3px_0_var(--border-strong)] transition-[border-color,box-shadow] focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15 has-disabled:bg-card has-disabled:opacity-100 dark:bg-card">
            <InputGroupTextarea
              aria-label="Escribe tu pregunta"
              autoComplete="off"
              className="min-h-11 max-h-36 px-3 py-2.5 text-base leading-6 text-foreground placeholder:text-muted-foreground"
              maxLength={TEXT_LIMITS.assistantPrompt}
              name="prompt"
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={dictation.listening ? 'Te escucho…' : 'Escribe tu pregunta…'}
              ref={promptRef}
              rows={1}
              value={prompt}
            />
            {/* Sin soporte de voz en el navegador (p. ej. Firefox) no se muestra. */}
            {dictation.supported && (
              <InputGroupButton
                aria-label={dictation.listening ? 'Detener dictado' : 'Dictar pregunta'}
                aria-pressed={dictation.listening}
                className={`size-11 shrink-0 rounded-full ${
                  dictation.listening
                    ? 'bg-destructive text-white ring-4 ring-destructive/25 hover:bg-destructive motion-safe:animate-pulse'
                    : 'bg-muted text-primary hover:bg-secondary'
                } disabled:bg-muted disabled:text-subtle disabled:opacity-100`}
                disabled={!isOnline || isLoading}
                onClick={() =>
                  dictation.listening ? dictation.stop() : dictation.start(prompt)
                }
                title={
                  isOnline
                    ? dictation.listening
                      ? 'Detener dictado'
                      : 'Dictar pregunta'
                    : 'El dictado necesita conexión'
                }
                type="button"
                variant="ghost"
              >
                {dictation.listening ? (
                  <Square aria-hidden="true" className="size-4 fill-white text-white" />
                ) : (
                  <Mic aria-hidden="true" className="size-5" />
                )}
              </InputGroupButton>
            )}
            <InputGroupButton
              aria-label="Enviar pregunta"
              className={`size-11 shrink-0 rounded-full disabled:opacity-100 ${
                puedeEnviar
                  ? 'bg-primary text-primary-foreground shadow-[0_3px_0_var(--relieve)] [--relieve:color-mix(in_oklab,var(--primary),black_45%)] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none'
                  : 'bg-muted text-subtle'
              }`}
              disabled={!puedeEnviar}
              title={isOnline ? 'Enviar pregunta' : 'El asistente necesita conexión'}
              type="submit"
              variant="default"
            >
              <ArrowUp aria-hidden="true" className="size-5" strokeWidth={2.5} />
            </InputGroupButton>
          </InputGroup>
        </form>
        <p
          aria-live="polite"
          className={`mt-2 min-h-5 px-2 text-center text-sm leading-5 ${
            dictation.error ? 'font-semibold text-destructive' : 'text-muted-foreground'
          }`}
        >
          {ayuda}
        </p>
      </footer>
    </section>
  );
}

export default AssistantPage;
