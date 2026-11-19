import { VoiceAssistant } from './components/VoiceAssistant';
import { PixPaymentCard } from './components/PixPaymentCard';
import { PixOfficialIcon } from './components/PixOfficialIcon';

export default function App() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#080D18] text-white flex flex-col justify-between">
      {/* Atmospheric Deep Midnight (#080D18), Technological Blue (#168BFF) & Turquoise (#19DDB5) Illumination */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        {/* Top technological blue halo behind virtual assistant */}
        <div className="absolute left-1/2 -top-36 h-[440px] w-[700px] -translate-x-1/2 rounded-full bg-[#168BFF]/20 blur-[125px]" />
        {/* Deep blue mid-canvas radial depth */}
        <div className="absolute left-1/2 top-[28%] h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-[#102B50]/40 blur-[110px]" />
        {/* Lower turquoise glow behind Pix card */}
        <div className="absolute left-1/2 top-[52%] h-[420px] w-[660px] -translate-x-1/2 rounded-full bg-[#19DDB5]/14 blur-[130px]" />
        {/* Subtle technical grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(22, 139, 255, 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(22, 139, 255, 0.45) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 lg:px-8 pt-10 pb-10 sm:pt-14 sm:pb-14 flex flex-col items-center justify-center gap-8 sm:gap-10">
        {/* Top Virtual Voice Assistant */}
        <VoiceAssistant />

        {/* Centered Pix Payment Card */}
        <PixPaymentCard />
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#080D18]/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 text-center space-y-2">
          <p className="text-sm sm:text-base font-medium text-slate-200 text-balance">
            Obrigado pela preferência! Seu pagamento é muito importante para nós.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#19DDB5]">
            <PixOfficialIcon className="h-4 w-4 shrink-0" />
            <span className="text-slate-300">Pagamento simples, rápido e seguro.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
