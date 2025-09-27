import Galaxy from "@/components/ui/Galaxy";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-center overflow-hidden">
      {/* Galaxy Background */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <Galaxy />
      </div>

      {/* Hero content */}
      <h1 className="font-display text-[2.5rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem] leading-tight text-dream-text drop-shadow-lg animate-fadeIn">
        Welcome to <span className="text-dream-indigo">DreamScape</span>
      </h1>

      <p className="mt-6 max-w-2xl font-body text-dream-text/80 text-base sm:text-lg md:text-xl animate-fadeInSlow">
        Build immersive AI-powered worlds where your imagination takes shape.
      </p>

      <div className="mt-10 flex gap-4 animate-fadeInSlow">
        <button className="btn-dream-indigo"
          onClick={() => window.location.href = "/world-builder"}>Start Building</button>
        <button className="btn-dream-pink">My Worlds</button>
      </div>
    </div>
  );
}
