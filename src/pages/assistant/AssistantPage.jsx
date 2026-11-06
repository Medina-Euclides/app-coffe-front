import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Leaf, LoaderCircle, Mic, Sprout, Wallet, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '#components/ui/avatar';
import { Button } from '#components/ui/button';
import { Bubble, BubbleContent } from '#components/ui/bubble';
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

const preguntasSugeridas = [
  { label: 'Resumen de cosecha', icon: Sprout },
  { label: 'Balance de este mes', icon: Wallet },
  { label: 'Pagos pendientes', icon: Users },
];

function AssistantAvatar() {
  return (
    <Avatar
      aria-label="CafeSmart"
      className="size-7 rounded-full bg-muted text-primary"
    >
      <AvatarFallback className="rounded-full bg-transparent">
        <Leaf aria-hidden="true" className="size-3.5" />
      </AvatarFallback>
    </Avatar>
  );
}

function formatTime(date) {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function AssistantPage({ usuario }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const nombre =
    usuario?.first_name ||
    usuario?.nombre ||
    usuario?.full_name?.split(' ')[0] ||
    'Euclides';
  const nextMessageId = useRef(0);
  const conversationRef = useRef(null);
  const conversationEndRef = useRef(null);
  const promptRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const conversation = conversationRef.current;
    conversation?.scrollTo({
      top: conversation.scrollHeight,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [isLoading, messages]);

  const enviarPregunta = async (event) => {
    event.preventDefault();
    const question = prompt.trim();
    if (!question || isLoading) return;

    setPrompt('');
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: nextMessageId.current++,
        role: 'user',
        content: question,
        time: formatTime(new Date()),
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
          time: formatTime(new Date()),
        },
      ]);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: nextMessageId.current++,
          role: 'assistant',
          content: `No pude responder en este momento. ${error.message}`,
          time: formatTime(new Date()),
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

  return (
    <section
      aria-label="Asistente CafeSmart"
      className="mx-auto flex min-h-0 w-full max-w-4xl flex-col overflow-hidden"
      style={{ height: 'calc(100dvh - 8rem)' }}
    >
      <div
        aria-label="Conversación con CafeSmart"
        aria-live="polite"
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-1 py-5 sm:px-2 sm:py-8"
        ref={conversationRef}
        role="log"
      >
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center px-2 pb-8 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-tint text-primary">
              <Leaf aria-hidden="true" className="size-5" />
            </div>
            <h2 className="mt-4 text-balance text-3xl text-foreground sm:text-4xl">
              Hola, {nombre}. ¿Qué quieres consultar?
            </h2>
            <p className="mt-2 max-w-md text-pretty text-sm leading-6 text-muted-foreground">
              Pregunta por tus cosechas, pagos o finanzas. Te ayudo a encontrar
              la información de tu finca.
            </p>
            <div className="mt-6 flex w-full flex-wrap justify-center gap-2">
              {preguntasSugeridas.map(({ label, icon: Icon }) => (
                <Button
                  className="h-9 rounded-full border-border bg-card px-3 text-xs font-medium text-ink-soft shadow-none hover:border-input hover:bg-muted hover:text-primary"
                  key={label}
                  onClick={() => seleccionarPregunta(label)}
                  type="button"
                  variant="outline"
                >
                  <Icon
                    aria-hidden="true"
                    className="size-3.5 text-muted-foreground"
                  />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <MessageGroup className="mx-auto max-w-3xl gap-6 sm:gap-8">
            {messages.map((message) =>
              message.role === 'user' ? (
                <Message
                  align="end"
                  className="gap-2.5"
                  key={message.id}
                >
                  <MessageContent className="max-w-[88%] gap-1 sm:max-w-[76%]">
                    <Bubble align="end" className="max-w-full" variant="secondary">
                      <BubbleContent className="whitespace-pre-wrap break-words rounded-2xl border-0 bg-muted px-4 py-3 text-[13px] leading-5 text-foreground sm:text-sm">
                        {message.content}
                      </BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              ) : (
                <Message className="gap-2.5" key={message.id}>
                  <MessageAvatar className="self-start">
                    <AssistantAvatar />
                  </MessageAvatar>
                  <MessageContent className="min-w-0 gap-1.5 pt-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      CafeSmart
                    </span>
                    <Bubble className="max-w-full" variant="ghost">
                      <BubbleContent className="whitespace-pre-wrap break-words p-0 text-[13px] leading-6 text-foreground sm:text-sm">
                        {message.content}
                      </BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              ),
            )}

            {isLoading && (
              <Message className="gap-2.5">
                <MessageAvatar className="self-start">
                  <AssistantAvatar />
                </MessageAvatar>
                <MessageContent className="min-w-0 gap-1.5 pt-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    CafeSmart
                  </span>
                  <div
                    className="flex items-center gap-2 py-1 text-sm text-muted-foreground"
                    role="status"
                  >
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin motion-reduce:animate-none"
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

      <footer className="mx-auto w-full max-w-3xl shrink-0 px-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-2 sm:pb-3">
        <form onSubmit={enviarPregunta}>
          <InputGroup className="min-h-[58px] rounded-3xl border-input bg-card p-1.5 shadow-[0_3px_14px_-10px_rgba(38,52,42,0.28)] transition-[border-color,box-shadow] focus-within:border-border-strong focus-within:ring-2 focus-within:ring-secondary">
            <InputGroupTextarea
              aria-label="Escribe tu mensaje"
              autoComplete="off"
              className="min-h-10 max-h-32 px-3 py-2.5 text-[14px] leading-5 placeholder:text-muted-foreground sm:text-sm"
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
              placeholder="Escribe tu pregunta…"
              ref={promptRef}
              rows={1}
              value={prompt}
            />
            <InputGroupButton
              aria-label="Micrófono, próximamente"
              className="size-10 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-ink-soft disabled:opacity-70"
              disabled
              title="Dictado por voz próximamente"
              variant="ghost"
            >
              <Mic aria-hidden="true" className="size-[18px]" />
            </InputGroupButton>
            <InputGroupButton
              aria-label="Enviar mensaje"
              className="size-10 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={isLoading || !prompt.trim()}
              title="Enviar mensaje"
              type="submit"
              variant="default"
            >
              <ArrowUp aria-hidden="true" className="size-[18px]" />
            </InputGroupButton>
          </InputGroup>
        </form>
        <p className="mt-2 text-center text-[10px] leading-4 text-muted-foreground sm:text-[11px]">
          Enter para enviar · Shift + Enter para una nueva línea
        </p>
      </footer>
    </section>
  );
}

export default AssistantPage;
