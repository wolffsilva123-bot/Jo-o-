import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  ShieldCheck,
  Smartphone,
  UserCheck,
} from 'lucide-react';
import { PixOfficialIcon } from './PixOfficialIcon';

const PIX_KEY_RAW = '24981381224';
const PIX_KEY_FORMATTED = '(24) 98138-1224';
const RECIPIENT_NAME = 'João Pedro';
const BANK_NAME = 'Banco do Brasil';
const PIX_KEY_TYPE = 'Celular';

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below for restricted iframe contexts
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function PixPaymentCard() {
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [buttonFeedbackActive, setButtonFeedbackActive] =
    useState<boolean>(false);
  const [copyError, setCopyError] = useState<boolean>(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleCopyPixKey = async () => {
    const success = await copyTextToClipboard(PIX_KEY_RAW);
    if (success) {
      setCopyError(false);
      setHasCopied(true);
      setButtonFeedbackActive(true);

      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = window.setTimeout(() => {
        setButtonFeedbackActive(false);
      }, 3400);
    } else {
      setCopyError(true);
    }
  };

  return (
    <section
      aria-labelledby="pix-card-title"
      className="relative mx-auto w-full max-w-xl lg:max-w-2xl"
    >
      {/* Ambient blue & turquoise glassmorphism backlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 rounded-[32px] bg-gradient-to-br from-[#168BFF]/30 via-[#102B50]/40 to-[#19DDB5]/25 blur-2xl opacity-85"
      />

      {/* Main Glassmorphism Payment Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[#168BFF]/25 bg-gradient-to-b from-[#102B50]/65 via-[#0B172C]/85 to-[#080D18]/92 p-6 sm:p-8 lg:p-10 shadow-[0_24px_64px_rgba(2,6,23,0.85),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl">
        {/* Specular top highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#19DDB5]/75 to-transparent"
        />

        {/* Card Header: Highlighted Official Pix Symbol + Title + Security Seal */}
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#19DDB5]/45 bg-[#19DDB5]/14 text-[#19DDB5] shadow-[0_0_24px_rgba(25,221,181,0.24)]">
              <PixOfficialIcon className="h-8 w-8" />
            </div>
            <div>
              <h1
                id="pix-card-title"
                className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance"
              >
                PAGAMENTO VIA PIX
              </h1>
              <p className="mt-1 text-sm sm:text-base text-slate-300">
                Rápido, prático e seguro.
              </p>
            </div>
          </div>

          {/* Selo Visual de Segurança */}
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#19DDB5]/40 bg-[#19DDB5]/12 px-3.5 py-2 text-xs font-semibold text-[#A7F3D0] shadow-[0_0_20px_rgba(25,221,181,0.16)] whitespace-nowrap shrink-0">
            <ShieldCheck
              className="h-4 w-4 text-[#19DDB5] shrink-0"
              aria-hidden="true"
            />
            <span>Pagamento Seguro</span>
          </div>
        </div>

        {/* Recipient, Bank & Pix Key Details */}
        <div className="relative mt-6 divide-y divide-white/10 rounded-2xl bg-[#080D18]/65 px-4 sm:px-6 backdrop-blur-md">
          {/* Recipient Name & Banco do Brasil */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 sm:py-5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#168BFF]/15 text-[#168BFF] shadow-[0_0_16px_rgba(22,139,255,0.2)]">
                <UserCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  Nome do recebedor
                </p>
                <p className="mt-0.5 text-lg sm:text-xl font-bold tracking-tight text-white truncate">
                  {RECIPIENT_NAME}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-5 shrink-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#168BFF]/12 text-[#60B4FF]">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Banco recebedor
                </p>
                <p className="mt-0.5 text-sm sm:text-base font-semibold text-white">
                  {BANK_NAME}
                </p>
              </div>
            </div>
          </div>

          {/* Formatted Pix Key with Smartphone Icon */}
          <div className="flex items-center justify-between gap-3 py-4 sm:py-5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#19DDB5]/15 text-[#19DDB5] shadow-[0_0_16px_rgba(25,221,181,0.2)]">
                <Smartphone className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  Chave Pix · {PIX_KEY_TYPE}
                </p>
                <p className="mt-0.5 font-mono text-xl sm:text-2xl font-semibold tracking-wide text-[#19DDB5] tabular-nums select-all truncate">
                  {PIX_KEY_FORMATTED}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyPixKey}
              aria-label="Copiar chave Pix 24981381224"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#19DDB5]/35 bg-[#19DDB5]/10 px-3 text-[#19DDB5] transition-all duration-200 hover:bg-[#19DDB5]/20 hover:border-[#19DDB5]/70 active:scale-95 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19DDB5]"
            >
              {buttonFeedbackActive ? (
                <Check className="h-5 w-5 text-white" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Primary Highlighted Turquoise CTA Button */}
        <div className="relative mt-6">
          <motion.button
            type="button"
            onClick={handleCopyPixKey}
            animate={
              buttonFeedbackActive
                ? { scale: [1, 1.018, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`group relative flex w-full min-h-[58px] items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-4 text-base sm:text-lg font-bold tracking-wide transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19DDB5] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D18] whitespace-nowrap active:scale-[0.985] ${
              buttonFeedbackActive
                ? 'bg-[#34F5CE] text-[#080D18] shadow-[0_0_44px_rgba(25,221,181,0.75),0_10px_28px_rgba(25,221,181,0.38)]'
                : 'bg-[#19DDB5] text-[#080D18] shadow-[0_0_34px_rgba(25,221,181,0.45),0_8px_24px_rgba(25,221,181,0.28)] hover:brightness-110 hover:shadow-[0_0_46px_rgba(25,221,181,0.68)]'
            }`}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer-sweep"
            />
            {buttonFeedbackActive ? (
              <CheckCircle2 className="relative z-10 h-5 w-5 shrink-0" aria-hidden="true" />
            ) : (
              <Copy className="relative z-10 h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            <span className="relative z-10">
              {buttonFeedbackActive ? 'CHAVE COPIADA!' : 'COPIAR CHAVE PIX'}
            </span>
          </motion.button>
        </div>

        {/* Confirmation Message & Bank App Instructions */}
        <AnimatePresence mode="wait">
          {hasCopied && (
            <motion.div
              key="copy-success"
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              role="status"
              aria-live="polite"
              className="relative mt-5 rounded-2xl border border-[#19DDB5]/45 bg-[#19DDB5]/12 p-4 sm:p-5 text-left shadow-[0_0_24px_rgba(25,221,181,0.14)]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#19DDB5]/25 text-[#19DDB5]">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm sm:text-base font-bold text-white">
                    Chave Pix copiada com sucesso!
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
                    A chave{' '}
                    <span className="font-mono font-semibold text-[#19DDB5]">
                      {PIX_KEY_RAW}
                    </span>{' '}
                    foi copiada sem espaços, parênteses ou traços. Agora abra o
                    aplicativo do seu banco, acesse a área{' '}
                    <strong className="font-semibold text-white">Pix</strong> e
                    conclua o pagamento para{' '}
                    <strong className="font-semibold text-white">
                      {RECIPIENT_NAME}
                    </strong>{' '}
                    ({BANK_NAME}).
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {copyError && !hasCopied && (
            <motion.div
              key="copy-error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="relative mt-4 rounded-xl border border-amber-400/40 bg-amber-500/12 px-4 py-3 text-xs sm:text-sm text-amber-100"
            >
              Não foi possível copiar automaticamente neste navegador. Utilize os
              números{' '}
              <span className="font-mono font-semibold text-white select-all">
                {PIX_KEY_RAW}
              </span>{' '}
              no aplicativo do seu banco para pagar{' '}
              <strong className="font-semibold text-white">
                {RECIPIENT_NAME}
              </strong>{' '}
              ({BANK_NAME}).
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simple 3-Step Flow */}
        <div className="relative mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#168BFF]/20 font-mono text-[11px] font-semibold text-[#60B4FF] tabular-nums">
              1
            </span>
            <span>Toque em Copiar Chave Pix</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#168BFF]/20 font-mono text-[11px] font-semibold text-[#60B4FF] tabular-nums">
              2
            </span>
            <span>Acesse o app do seu banco</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#19DDB5]/20 font-mono text-[11px] font-semibold text-[#19DDB5] tabular-nums">
              3
            </span>
            <span>Confirme {RECIPIENT_NAME}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
