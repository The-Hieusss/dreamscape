import LiquidEther from "@/components/ui/LiquidEther";
import Navbar from "@/components/ui/NavBar";

export default function Home() {

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <LiquidEther
          colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
          mouseForce={20}
          cursorSize={100}
          resolution={0.5}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
          className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300"
        />
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-dream-indigo/20 via-dream-pink/20 to-dream-cyan/20 bg-[length:200%_200%] animate-gradient-x opacity-40" />

      {/* Nav */}
      <Navbar />
      
      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center text-center mt-20 px-4 sm:px-6">
        <h3 className="font-heading text-sm sm:text-base md:text-lg text-dream-text/80">
          Welcome to
        </h3>
        <h1 className="font-display text-[clamp(2.5rem,8vw,6rem)] leading-tight bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-lg">
          DreamScape
        </h1>
        <p className="mt-4 max-w-2xl text-sm sm:text-base md:text-lg text-dream-text/80">
          Where imagination meets reality.
        </p>

        <div className="mt-12 border-t border-dream-white/20 w-1/2" />

        <h2 className="mt-8 font-display text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
          Transform Your Digital Ideas
        </h2>
        <p className="mt-2 max-w-xl text-sm sm:text-base md:text-lg text-dream-text/80">
          Create stunning experiences with our AI-powered world builder.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={() => (window.location.href = "/get-started")}
            className="px-8 py-3 rounded-full bg-dream-indigo font-semibold hover:scale-105 transition-transform"
          >
            Create
          </button>
          <form className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Hey DreamScape, create mountains..."
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-full placeholder-dream-text/50 text-dream-text w-full sm:w-72 md:w-96 focus:outline-none focus:ring-2 focus:ring-dream-indigo"
            />
          </form>
        </div>
      </main>
    </div>
  );
}
