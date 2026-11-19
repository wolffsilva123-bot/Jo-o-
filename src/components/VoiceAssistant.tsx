import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

export const ASSISTANT_GREETING_TEXT =
  'Olá! Seja bem-vindo. Para realizar seu pagamento via Pix, basta clicar no botão Copiar Chave Pix e depois acessar o aplicativo do seu banco para concluir o pagamento. O banco recebedor é o Banco do Brasil, em nome de João Pedro. É simples, rápido e seguro. Obrigado!';

type AssistantStatus =
  | 'loading'
  | 'playing'
  | 'paused'
  | 'blocked'
  | 'ended'
  | 'error';

const INNER_BAR_COUNT = 9;
const OUTER_BAR_COUNT = 26;

const ASSISTANT_SENTENCES = [
  'Olá! Seja bem-vindo.',
  'Para realizar seu pagamento via Pix, basta clicar no botão Copiar Chave Pix e depois acessar o aplicativo do seu banco para concluir o pagamento.',
  'O banco recebedor é o Banco do Brasil, em nome de João Pedro.',
  'É simples, rápido e seguro.',
  'Obrigado!',
];

function pickNaturalPtBrFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  const ptBrVoices = voices.filter((v) =>
    v.lang.toLowerCase().replace('_', '-').startsWith('pt-br')
  );

  if (ptBrVoices.length === 0) return null;

  const excludedMaleOrRobotic = [
    'daniel',
    'antonio',
    'antônio',
    'fabio',
    'fábio',
    'humberto',
    'julio',
    'júlio',
    'nicolau',
    'ricardo',
    'felipe',
    'tiago',
    'espeak',
  ];

  const naturalFemaleKeywords = [
    'online (natural)',
    'google português',
    'francisca',
    'thalita',
    'luciana',
    'fernanda',
    'camila',
    'raquel',
    'vitória',
    'vitoria',
  ];

  const cleanPool = ptBrVoices.filter(
    (v) => !excludedMaleOrRobotic.some((ex) => v.name.toLowerCase().includes(ex))
  );

  for (const kw of naturalFemaleKeywords) {
    const match = cleanPool.find((v) => v.name.toLowerCase().includes(kw));
    if (match) return match;
  }

  // Only allow browser speech fallback when a genuinely natural voice is present
  return null;
}

export function VoiceAssistant() {
  const [status, setStatus] = useState<AssistantStatus>('loading');
  const [statusNote, setStatusNote] = useState<string>('');
  const [showTranscript, setShowTranscript] = useState<boolean>(true);
  const [innerLevels, setInnerLevels] = useState<number[]>(() =>
    Array(INNER_BAR_COUNT).fill(0.22)
  );
  const [outerLevels, setOuterLevels] = useState<number[]>(() =>
    Array(OUTER_BAR_COUNT).fill(0.16)
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceConnectedRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const usingSpeechFallbackRef = useRef<boolean>(false);
  const speechTimerRef = useRef<number | null>(null);
  const speechCancelledRef = useRef<boolean>(false);
  const phaseRef = useRef<number>(0);

  const stopWaveLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setInnerLevels(Array(INNER_BAR_COUNT).fill(0.22));
    setOuterLevels(Array(OUTER_BAR_COUNT).fill(0.16));
  }, []);

  const startWaveLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    const freqData = analyserRef.current
      ? new Uint8Array(analyserRef.current.frequencyBinCount)
      : null;

    const tick = () => {
      phaseRef.current += 0.14;
      const t = phaseRef.current;

      let hasLiveAudioData = false;
      if (
        analyserRef.current &&
        freqData &&
        audioCtxRef.current?.state === 'running' &&
        !usingSpeechFallbackRef.current
      ) {
        analyserRef.current.getByteFrequencyData(freqData);
        const sum = freqData.reduce((acc, v) => acc + v, 0);
        if (sum > 18) {
          hasLiveAudioData = true;
        }
      }

      if (hasLiveAudioData && freqData) {
        const nextInner = Array.from({ length: INNER_BAR_COUNT }, (_, i) => {
          const distFromCenter = Math.abs(i - (INNER_BAR_COUNT - 1) / 2);
          const binIndex = Math.min(freqData.length - 1, 2 + i * 3);
          const norm = freqData[binIndex] / 255;
          const centerWeight = 1 - distFromCenter * 0.08;
          return Math.max(0.2, Math.min(1, 0.2 + norm * 0.92 * centerWeight));
        });
        const nextOuter = Array.from({ length: OUTER_BAR_COUNT }, (_, i) => {
          const binIndex = Math.min(freqData.length - 1, 1 + Math.floor(i * 1.4));
          const norm = freqData[binIndex] / 255;
          return Math.max(0.14, Math.min(1, 0.16 + norm * 0.88));
        });
        setInnerLevels(nextInner);
        setOuterLevels(nextOuter);
      } else {
        const nextInner = Array.from({ length: INNER_BAR_COUNT }, (_, i) => {
          const centerEnv =
            1 - Math.abs(i - (INNER_BAR_COUNT - 1) / 2) / (INNER_BAR_COUNT * 0.65);
          const wave =
            0.44 +
            0.34 * Math.sin(t * 1.42 + i * 0.85) +
            0.2 * Math.cos(t * 2.25 - i * 0.6);
          return Math.max(0.22, Math.min(1, wave * centerEnv + 0.14));
        });
        const nextOuter = Array.from({ length: OUTER_BAR_COUNT }, (_, i) => {
          const centerEnv =
            1 - Math.abs(i - (OUTER_BAR_COUNT - 1) / 2) / (OUTER_BAR_COUNT * 0.7);
          const wave =
            0.38 +
            0.34 * Math.sin(t * 1.28 + i * 0.52) +
            0.22 * Math.sin(t * 2.55 + i * 1.1);
          return Math.max(0.14, Math.min(1, wave * centerEnv + 0.12));
        });
        setInnerLevels(nextInner);
        setOuterLevels(nextOuter);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const connectAnalyserSafely = useCallback(async (audioEl: HTMLAudioElement) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume().catch(() => {});
      }

      // Only connect MediaElementSource when AudioContext is actively running
      // so audio output is never muted by a suspended context.
      if (
        !sourceConnectedRef.current &&
        audioCtxRef.current.state === 'running'
      ) {
        const source = audioCtxRef.current.createMediaElementSource(audioEl);
        const analyser = audioCtxRef.current.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.78;
        source.connect(analyser);
        analyser.connect(audioCtxRef.current.destination);

        analyserRef.current = analyser;
        sourceConnectedRef.current = true;
      }
    } catch {
      // Fall back to organic wave animation without interrupting playback
    }
  }, []);

  const cancelSpeechFallback = useCallback(() => {
    speechCancelledRef.current = true;
    if (speechTimerRef.current !== null) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const playNaturalSpeechFallback = useCallback((): boolean => {
    const voice = pickNaturalPtBrFemaleVoice();
    if (!voice || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }

    try {
      usingSpeechFallbackRef.current = true;
      cancelSpeechFallback();
      speechCancelledRef.current = false;

      let idx = 0;

      const speakNextSentence = () => {
        if (speechCancelledRef.current) return;
        if (idx >= ASSISTANT_SENTENCES.length) {
          setStatus('ended');
          stopWaveLoop();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(ASSISTANT_SENTENCES[idx]);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        utterance.volume = 0.96;
        utterance.voice = voice;

        utterance.onstart = () => {
          if (speechCancelledRef.current) return;
          setStatus('playing');
          setStatusNote('');
          startWaveLoop();
        };

        utterance.onend = () => {
          if (speechCancelledRef.current) return;
          idx += 1;
          if (idx >= ASSISTANT_SENTENCES.length) {
            setStatus('ended');
            stopWaveLoop();
          } else {
            speechTimerRef.current = window.setTimeout(speakNextSentence, 280);
          }
        };

        utterance.onerror = () => {
          if (speechCancelledRef.current) return;
          setStatus('blocked');
          setStatusNote('Toque no botão abaixo para ouvir a assistente.');
          stopWaveLoop();
        };

        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      };

      setStatus('playing');
      startWaveLoop();
      speakNextSentence();
      return true;
    } catch {
      return false;
    }
  }, [cancelSpeechFallback, startWaveLoop, stopWaveLoop]);

  const fetchNeuralVoiceAudio = useCallback(async (): Promise<HTMLAudioElement> => {
    const res = await fetch('/api/assistant-voice?v=joao-pedro-2');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    blobUrlRef.current = url;

    const audio = new Audio(url);
    audio.preload = 'auto';
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      setStatus('ended');
      stopWaveLoop();
    });

    audio.addEventListener('pause', () => {
      if (!audio.ended) {
        setStatus((prev) => (prev === 'playing' ? 'paused' : prev));
        stopWaveLoop();
      }
    });

    audio.addEventListener('play', () => {
      setStatus('playing');
      setStatusNote('');
      startWaveLoop();
    });

    return audio;
  }, [startWaveLoop, stopWaveLoop]);

  const startPlayback = useCallback(
    async (fromUserGesture = false) => {
      let audio = audioRef.current;

      if (!audio && fromUserGesture) {
        try {
          setStatus('loading');
          setStatusNote('');
          audio = await fetchNeuralVoiceAudio();
          usingSpeechFallbackRef.current = false;
        } catch {
          const startedFallback = playNaturalSpeechFallback();
          if (!startedFallback) {
            setStatus('error');
            setStatusNote(
              'Não foi possível carregar o áudio neural no momento. Tente novamente em instantes.'
            );
            stopWaveLoop();
          }
          return;
        }
      }

      if (usingSpeechFallbackRef.current) {
        playNaturalSpeechFallback();
        return;
      }

      if (!audio) return;

      try {
        if (fromUserGesture) {
          await connectAnalyserSafely(audio);
        }
        audio.currentTime = 0;
        await audio.play();
        setStatus('playing');
        setStatusNote('');
        startWaveLoop();
      } catch (err) {
        const isNotAllowed =
          err instanceof DOMException && err.name === 'NotAllowedError';
        if (isNotAllowed) {
          setStatus('blocked');
          setStatusNote(
            'Seu navegador pausou o áudio automático. Toque abaixo para ativar a voz da assistente.'
          );
          stopWaveLoop();
        } else {
          const startedFallback = playNaturalSpeechFallback();
          if (!startedFallback) {
            setStatus('error');
            setStatusNote('Não foi possível reproduzir o áudio no momento.');
            stopWaveLoop();
          }
        }
      }
    },
    [
      connectAnalyserSafely,
      fetchNeuralVoiceAudio,
      playNaturalSpeechFallback,
      startWaveLoop,
      stopWaveLoop,
    ]
  );

  useEffect(() => {
    let cancelled = false;

    async function initAssistantAudio() {
      try {
        await fetchNeuralVoiceAudio();
        if (cancelled) return;
        await startPlayback(false);
      } catch {
        if (cancelled) return;
        const ok = playNaturalSpeechFallback();
        if (!ok) {
          setStatus('error');
          setStatusNote(
            'Áudio neural temporariamente indisponível. Você pode ler as instruções abaixo ou tentar novamente.'
          );
        }
      }
    }

    void initAssistantAudio();

    return () => {
      cancelled = true;
      stopWaveLoop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        cancelSpeechFallback();
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [
    cancelSpeechFallback,
    fetchNeuralVoiceAudio,
    playNaturalSpeechFallback,
    startPlayback,
    stopWaveLoop,
  ]);

  const handleToggleOrb = async () => {
    if (status === 'playing') {
      if (usingSpeechFallbackRef.current && 'speechSynthesis' in window) {
        cancelSpeechFallback();
        setStatus('paused');
        stopWaveLoop();
        return;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        setStatus('paused');
        stopWaveLoop();
      }
      return;
    }

    if (
      status === 'paused' &&
      audioRef.current &&
      !usingSpeechFallbackRef.current
    ) {
      try {
        await connectAnalyserSafely(audioRef.current);
        await audioRef.current.play();
        setStatus('playing');
        setStatusNote('');
        startWaveLoop();
        return;
      } catch {
        // Fall through to full replay
      }
    }

    await startPlayback(true);
  };

  const handleReplay = async () => {
    await startPlayback(true);
  };

  const isSpeaking = status === 'playing';

  return (
    <section
      aria-label="Assistente Virtual de Pagamento"
      className="relative flex w-full max-w-2xl flex-col items-center text-center"
    >
      {/* Illuminated Technological-Blue Virtual Assistant Circle */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Ambient radial glow (#168BFF + #19DDB5) */}
        <div
          aria-hidden="true"
          className={`absolute -inset-7 rounded-full bg-[#168BFF]/25 blur-2xl transition-opacity duration-300 ${
            isSpeaking ? 'opacity-100' : 'opacity-50'
          }`}
        />

        {/* Expanding pulse rings synchronized with speaking state */}
        {isSpeaking && (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-[#168BFF]/60 animate-pulse-ring"
            />
            <span
              aria-hidden="true"
              className="absolute -inset-3 rounded-full border border-[#19DDB5]/35 animate-pulse-ring [animation-delay:0.75s]"
            />
          </>
        )}

        {/* Interactive Assistant Orb */}
        <button
          type="button"
          onClick={handleToggleOrb}
          aria-label={
            isSpeaking
              ? 'Pausar assistente virtual'
              : 'Ouvir orientações da assistente virtual'
          }
          className="group relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-[#102B50] border border-[#168BFF]/55 shadow-[0_0_44px_rgba(22,139,255,0.48),inset_0_0_26px_rgba(22,139,255,0.3)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168BFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D18] cursor-pointer"
        >
          {/* Rotating conic halo */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -inset-[2px] rounded-full bg-[conic-gradient(from_0deg,rgba(22,139,255,0.95),rgba(25,221,181,0.55),rgba(16,43,80,0.2),rgba(22,139,255,0.95))] opacity-85 blur-[1px] ${
              isSpeaking ? 'animate-spin-slow' : 'opacity-50'
            }`}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[2px] rounded-full bg-gradient-to-b from-[#102B50] via-[#0B1C38] to-[#080D18]"
          />

          {/* Inner Sound Waves inside the illuminated blue circle */}
          <div
            aria-hidden="true"
            className="relative z-10 flex h-12 items-center justify-center gap-1.5 px-3"
          >
            {innerLevels.map((level, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-colors duration-200 ${
                  isSpeaking
                    ? 'bg-gradient-to-t from-[#168BFF] via-[#60B4FF] to-[#19DDB5] shadow-[0_0_10px_rgba(22,139,255,0.85)]'
                    : 'bg-[#168BFF]/60 group-hover:bg-[#168BFF]'
                }`}
                style={{
                  height: '44px',
                  transform: `scaleY(${level})`,
                  willChange: 'transform',
                }}
              />
            ))}
          </div>
        </button>
      </div>

      {/* Assistant Identity & Voice State */}
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-medium tracking-wide text-[#168BFF]">
          Assistente Virtual Pix
        </p>
        <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight text-balance">
          {isSpeaking
            ? 'Orientando seu pagamento agora'
            : status === 'loading'
              ? 'Preparando áudio de boas-vindas...'
              : status === 'blocked'
                ? 'Ative o áudio para ouvir as orientações'
                : status === 'paused'
                  ? 'Áudio pausado'
                  : status === 'error'
                    ? 'Instruções disponíveis abaixo'
                    : 'Atendimento por voz pronto'}
        </h2>
      </div>

      {/* Synchronized Sound Wave Strip */}
      <div
        aria-hidden="true"
        className="mt-3 flex h-7 items-center justify-center gap-1"
      >
        {outerLevels.map((level, idx) => (
          <span
            key={idx}
            className={`w-[3px] rounded-full transition-colors duration-200 ${
              isSpeaking
                ? 'bg-gradient-to-t from-[#168BFF] to-[#19DDB5]'
                : 'bg-[#102B50]'
            }`}
            style={{
              height: '24px',
              transform: `scaleY(${level})`,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      {/* Voice Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {status === 'blocked' ? (
          <button
            type="button"
            onClick={handleToggleOrb}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#168BFF] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_26px_rgba(22,139,255,0.5)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D18]"
          >
            <Volume2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Ativar áudio da assistente</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleOrb}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#168BFF]/40 bg-[#102B50]/65 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-[#168BFF]/20 hover:border-[#168BFF]/70 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168BFF]"
          >
            {isSpeaking ? (
              <>
                <Pause className="h-4 w-4 text-[#168BFF] shrink-0" aria-hidden="true" />
                <span>Pausar voz</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 text-[#19DDB5] shrink-0" aria-hidden="true" />
                <span>{status === 'ended' ? 'Ouvir novamente' : 'Ouvir assistente'}</span>
              </>
            )}
          </button>
        )}

        {(status === 'playing' || status === 'paused' || status === 'error') && (
          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#102B50]/40 px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-md transition-colors duration-200 hover:border-[#168BFF]/50 hover:text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168BFF]"
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Ouvir novamente</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowTranscript((v) => !v)}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#080D18]/70 px-3.5 py-2.5 text-xs font-medium text-slate-300 transition-colors duration-200 hover:border-white/25 hover:text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168BFF]"
        >
          {showTranscript ? (
            <Volume2 className="h-3.5 w-3.5 text-[#168BFF] shrink-0" aria-hidden="true" />
          ) : (
            <VolumeX className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          )}
          <span>{showTranscript ? 'Ocultar legenda' : 'Ver legenda'}</span>
        </button>
      </div>

      {statusNote && (
        <p className="mt-2.5 max-w-md text-xs text-[#60B4FF]">{statusNote}</p>
      )}

      {/* Accessible Voice Transcript Box */}
      {showTranscript && (
        <div className="mt-4 max-w-xl rounded-2xl border border-[#168BFF]/20 bg-[#102B50]/35 px-5 py-3.5 text-sm leading-relaxed text-slate-200 backdrop-blur-xl shadow-[0_12px_32px_rgba(8,13,24,0.5)]">
          <p className="text-pretty">“{ASSISTANT_GREETING_TEXT}”</p>
        </div>
      )}
    </section>
  );
}
