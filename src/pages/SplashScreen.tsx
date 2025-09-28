export default function SplashScreen() {
  
  return (
    <div
      className="
        relative flex flex-col items-center justify-center
        min-h-screen w-full overflow-hidden
        px-4 sm:px-6 md:px-10 pt-safe-top pb-safe-bottom
        bg-slate-950
      "
    >
      {/* Layered animated gradients (reduced-motion safe) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_30%_25%,rgba(99,102,241,0.55),transparent_60%)]" />
        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_70%_75%,rgba(236,72,153,0.45),transparent_65%)]" />
        <div className="absolute inset-0 mix-blend-overlay bg-[linear-gradient(115deg,rgba(255,255,255,0.10),rgba(255,255,255,0)_55%)]" />
        <div className="absolute inset-0 opacity-[0.08] bg-[url('/noise.png')]" />
        <div className="absolute -inset-[40%] rounded-[50%] bg-gradient-to-tr from-fuchsia-500/10 via-indigo-400/10 to-cyan-400/10 blur-3xl animate-pulse-slow motion-reduce:hidden" />
      </div>

      {/* Logo / Title */}
      <div className="relative flex flex-col items-center text-center select-none">
        <h1
          className="
            font-display font-bold leading-[0.85]
            bg-gradient-to-r from-cyan-200 via-purple-200 to-pink-200
            bg-clip-text text-transparent drop-shadow-[0_4px_18px_rgba(168,85,247,0.35)]
            tracking-tight
            text-[clamp(2.8rem,13vw,7rem)]
          "
          aria-label="DreamScape"
        >
          Dreamscape.
        </h1>

        <p
          className="
            mt-5 sm:mt-6 max-w-sm sm:max-w-md
            font-body font-medium
            text-[clamp(.9rem,2.6vw,1.25rem)]
            text-slate-300/90 leading-snug
            animate-fade-in-up motion-reduce:animate-none
          "
        >
          Make your dreams come alive in 3D.
        </p>

        {/* Progress / loader */}
        <div className="mt-10 w-52 h-2 rounded-full bg-white/10 overflow-hidden backdrop-blur-sm border border-white/15 shadow-inner">
          <div className="h-full w-full origin-left bg-gradient-to-r from-pink-400 via-fuchsia-400 to-cyan-400 animate-loading-bar motion-reduce:bg-pink-400 motion-reduce:animate-none" />
        </div>

      </div>

      <span className="sr-only">
        Splash screen loading. Press skip to continue.
      </span>
    </div>
  );
}