import { useState } from "react";
import { House, Earth, Users, Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
    const [active, setActive] = useState("home");

  const navItems = [
    { id: "home", label: "Home", icon: <House size={20} /> },
    { id: "explore", label: "Explore", icon: <Earth size={20} /> },
    { id: "community", label: "Community", icon: <Users size={20} /> },
  ];

  return (
    <header className="w-full flex items-center justify-between px-6 py-4  relative z-50">
      {/* Left: Logo + Brand */}
      <div className="flex items-center gap-3">
        <img
          src="/dreamscape.logo.png"
          alt="DreamScape Logo"
          className="h-10 w-10"
        />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-300 to-blue-300 bg-clip-text text-transparent">
          DreamScape
        </h1>
      </div>

      {/* Center Nav (Desktop only) */}
      <nav className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl ">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-full font-semibold transition-all duration-300
              ${active === item.id
                ? "bg-pink-400 text-black shadow-[0_0_15px_rgba(236,72,153,0.6)]"
                : "text-white/70 hover:bg-white/20 hover:text-white"}
            `}
          >
            {item.icon}
            <span
              className={`
                overflow-hidden transition-all duration-300
                ${active === item.id ? "w-auto opacity-100 ml-1" : "w-0 opacity-0"}
                group-hover:w-auto group-hover:opacity-100
              `}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Right CTA (Desktop only) */}
      <button className="hidden lg:block px-6 py-2 rounded-full bg-cyan-400 text-black font-semibold shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:scale-105 transition-transform duration-300">
        Sign Up
      </button>

      {/* Mobile Menu Toggle */}
      <button
        className="lg:hidden p-2 rounded-md bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
      </button>

      {/* Mobile Slide-in Menu */}
      {mobileOpen && (
        <div className="absolute top-0 left-0 w-full h-screen bg-[#050B1A]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6 animate-fadeIn">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-md bg-white/10 hover:bg-white/20"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-pink-400 text-black font-semibold shadow-[0_0_20px_rgba(236,72,153,0.6)]">
            <House className="h-5 w-5" /> Home
          </button>
          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-dream-indigo transition">
            <Earth className="h-5 w-5" /> Worlds
          </button>
          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-dream-indigo transition">
            <Users className="h-5 w-5" /> Community
          </button>
          <button className="px-8 py-3 rounded-full bg-cyan-400 text-black font-semibold shadow-[0_0_20px_rgba(34,211,238,0.6)] hover:scale-105 transition-transform">
            Sign Up
          </button>
        </div>
      )}
    </header>
  );
}
