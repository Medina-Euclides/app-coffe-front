// Dictado por voz con el reconocimiento del propio navegador (Web Speech API).
// El texto se va escribiendo mientras la persona habla y se agrega después de lo
// que ya había en la caja; no se envía solo, para que pueda revisarlo.
import { useCallback, useEffect, useRef, useState } from 'react';

// Chrome/Edge/Android y Safari (iPhone) lo traen; Firefox no.
const SpeechRecognition =
  typeof window === 'undefined'
    ? null
    : window.SpeechRecognition || window.webkitSpeechRecognition || null;

const ERROR_MS = 5000;

const errorMessages = {
  'not-allowed': 'Permite el uso del micrófono en el navegador para dictar.',
  'service-not-allowed': 'Permite el uso del micrófono en el navegador para dictar.',
  'no-speech': 'No te escuché. Toca el micrófono e inténtalo de nuevo.',
  'audio-capture': 'No se encontró un micrófono en este dispositivo.',
  network: 'El dictado necesita internet. Revisa tu conexión.',
};

// Brave, Vivaldi, Opera y el Chromium de Linux traen la API pero sin el servicio
// de Google que transcribe: fallan con «network» aunque haya internet.
const UNAVAILABLE_MESSAGE =
  'Este navegador no trae dictado por voz. Usa Google Chrome, Edge o Safari.';

// Une lo que ya estaba escrito con lo dictado, con un solo espacio entre ambos.
function joinText(base, spoken) {
  const left = base.trimEnd();
  const right = spoken.trim();
  if (!right) return base;
  return left ? `${left} ${right}` : right;
}

export function useSpeechDictation({ lang = 'es-CO', onText }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const onTextRef = useRef(onText);
  // Si el navegador no tiene el servicio, no se vuelve a intentar en esta visita.
  const unavailableRef = useRef(false);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(''), ERROR_MS);
    return () => clearTimeout(timer);
  }, [error]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(
    (baseText = '') => {
      if (!SpeechRecognition || recognitionRef.current) return;
      if (unavailableRef.current) {
        setError(UNAVAILABLE_MESSAGE);
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.interimResults = true;
      // Se detiene sola tras una pausa: es lo más estable en Android.
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let spoken = '';
        for (let index = 0; index < event.results.length; index += 1) {
          spoken += event.results[index][0].transcript;
        }
        onTextRef.current?.(joinText(baseText, spoken));
      };
      recognition.onerror = (event) => {
        if (event.error === 'aborted') return;
        if (event.error === 'network' && navigator.onLine) {
          unavailableRef.current = true;
          setError(UNAVAILABLE_MESSAGE);
          return;
        }
        setError(errorMessages[event.error] || 'No se pudo usar el dictado. Inténtalo de nuevo.');
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setListening(false);
      };

      recognitionRef.current = recognition;
      setError('');
      setListening(true);
      try {
        recognition.start();
      } catch (startError) {
        console.error('No se pudo iniciar el dictado:', startError);
        recognitionRef.current = null;
        setListening(false);
        setError('No se pudo usar el dictado. Inténtalo de nuevo.');
      }
    },
    [lang],
  );

  return { supported: Boolean(SpeechRecognition), listening, error, start, stop };
}
