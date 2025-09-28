import { Earth, House, LogOut, Menu } from "lucide-react";
import LiquidEther from "@/components/LiquidEther";
import { useState } from "react";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div>
      {" "}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <LiquidEther
          colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>
      <div className="relative flex flex-col items-center justify-center min-h-screen text-center overflow-hidden">
        {/* Galaxy Background */}
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        ></div>

        <div className="absolute inset-0 bg-gradient-to-tr from-dream-indigo/20 via-dream-pink/20 to-dream-cyan/20 bg-[length:200%_200%] animate-gradient-x opacity-40" />

        {/* Navigation Bar */}
        <nav className="hidden lg:flex w-full p-6 flex justify-around align-center items-center absolute top-0 left-0 z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <div className="flex items-center flex-row gap-3">
            <img
              src="dreamscape.logo.png"
              alt="DreamScape Logo"
              className="h-10 w-10"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent hover:scale-105 transition-transform duration-200 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              DreamScape
            </h1>
          </div>

          {/* 3 Nav bar Buttons */}
          <div className="relative flex flex-row justify-center align-center items-center overflow-hidden border-2 border-dream-indigo rounded-full pt-1 pb-1 pl-15 pr-15 gap-6 border-white/15 rounded-2xl bg-white/10 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center flex-row gap-5">
              <button
                className="btn-home rounded-full hover:scale-105 transition-transform duration-200 cursor-pointer hover:bg-dream-pink hover:transition-0.5s ease-in-out box-shadow: 0 0 15px pt-1 pb-1 pl-4 pr-4"
                onClick={() => (window.location.href = "/world-builder")}
              >
                <House className="h-8 w-8" />
              </button>
            </div>

            <div className="flex items-center flex-row gap-5">
              <button
                className="btn-myworlds rounded-full hover:scale-105 transition-transform duration-200 cursor-pointer hover:bg-dream-pink hover:transition-0.5s ease-in-out box-shadow: 0 0 15px pt-1 pb-1 pl-4 pr-4"
                onClick={() => (window.location.href = "/world-builder")}
              >
                <Earth className="h-8 w-8" />
              </button>
            </div>

            <div className="flex items-center flex-row gap-5">
              <button
                className="btn-login rounded-full hover:scale-105 transition-transform duration-200 cursor-pointer hover:bg-dream-pink hover:transition-0.5s ease-in-out box-shadow: 0 0 15px pt-1 pb-1 pl-4 pr-4"
                onClick={() => (window.location.href = "/login")}
              >
                <LogOut className="h-8 w-8" />
              </button>
            </div>
          </div>

          {/* Sign Up Button */}
          <div className="relative flex flex-row items-center gap-4 justify-center text-center cursor-pointer overflow-hidden font-semibold border-2 border-dream-pink bg-dream-pink rounded-full pt-3 pb-3 pl-8 pr-8 cursor-pointer hover:scale-105 transition-transform duration-200 hover:bg-dream-indigo hover:border-dream-indigo box-shadow: 0 0 15px color: text-dream-white hover:text-dream-white blur-4 ease-in-out hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <button
              className="btn-signup"
              onClick={() => (window.location.href = "/signup")}
            >
              Sign Up
            </button>
          </div>
        </nav>

        <button
          className="lg:hidden absolute top-6 left-6 z-20 p-2 rounded-md bg-white/15 backdrop-blur-sm hover:bg-white/15 transition-colors duration-200 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <Menu className="h-8 w-8" />
        </button>

        {mobileOpen && (
          <div className="lg:hidden flex flex-col absolute top-20 left-6 right-6 z-20 backdrop-blur-sm bg-white/20 rounded-lg shadow-lg space-y-4 ">
            <div className="flex flex-col justify-center align-center items-center mt-8">
              <h2 className=" font-display w-full text-dream-text/80 text-5xl font-semibold text-dream-indigo bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                Menu
              </h2>

            </div>

            <div className="flex flex-col gap-5 justify-center align-center items-center mt-5 mb-5 gap-3">
              <button
                className="w-full text-center px-4 py-2 rounded-md text-1xl font-semibold hover:bg-dream-indigo hover:text-white transition-colors duration-200 cursor-pointer hover:scale-105 transition-transform duration-200 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                onClick={() => {
                  setMobileOpen(false);
                  window.location.href = "/world-builder";
                }}
              >
                Home
              </button>

              <button
                className="w-full text-center px-4 py-2 rounded-md text-1xl font-semibold hover:bg-dream-indigo hover:text-white transition-colors duration-200 cursor-pointer hover:scale-105 transition-transform duration-200 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                onClick={() => {
                  setMobileOpen(false);
                  window.location.href = "/my-worlds";
                }}
              >
                Create
              </button>

              <button
                className="w-full mb-5 text-center px-4 py-2 rounded-md text-1xl font-semibold hover:bg-dream-indigo hover:text-white transition-colors duration-200 cursor-pointer hover:scale-105 transition-transform duration-200 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                onClick={() => {
                  setMobileOpen(false);
                  window.location.href = "/login";
                }}
              >
                Login
              </button>

              <button
                className="w-40 mb-5 text-center px-4 py-2 rounded-full text-1xl font-semibold overflow-hidden font-semibold border-2 border-dream-pink bg-dream-pink rounded-full pt-3 pb-3 pl-8 pr-8 cursor-pointer hover:scale-105 transition-transform duration-200 hover:bg-dream-indigo hover:border-dream-indigo box-shadow: 0 0 15px color: text-dream-white hover:text-dream-white blur-4 ease-in-out hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                onClick={() => {
                  setMobileOpen(false);
                  window.location.href = "/signup";
                }}
              >
                Sign Up
              </button>
            </div>
          </div>


        )}

        {/* Hero content */}
        <div className="mt-30 relative z-10 flex flex-col gap-4 h-full px-4 animate-fadeInSlow">
          <h3 className="font-heading text-dream-text/80 text-sm sm:text-base md:text-lg animate-fadeIn mt-1">
            Welcome to
          </h3>
          <h1 className="font-display text-[2.5rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem] leading-tight text-dream-text drop-shadow-lg animate-fadeIn">
            <span className="md:text-7xl text-dream-indigo bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              {" "}
              DreamScape
            </span>
          </h1>

          <p className="max-w-2xl font-heading text-dream-text/80 text-base sm:text-lg md:text-xl animate-fadeInSlow">
            Where imagination meets reality.
          </p>
        </div>

        <div className="border-t border-t-dream-white-500 w-[40%] h-full mt-10 animate-fadeInSlow" />

        <div className="flex flex-col gap-4 mt-6">
          <h2 className="font-display text-dream-text/80 text-xl sm:text-2xl md:text-3xl animate-fadeIn font-semibold text-dream-indigo bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            Transform Your Digital Ideas
          </h2>

          <p className="max-w-2xl font-heading text-dream-text/80 text-sm sm:text-base md:text-lg animate-fadeInSlow">
            Create stunning digital experiences with our cutting-edge platform.
          </p>

          <p className="max-w-2xl font-heading text-dream-text/80 text-sm sm:text-base md:text-lg animate-fadeInSlow">
            Where creativity meets technology in perfect harmony.
          </p>
        </div>

        {/* Chatbot Input */}
        <div className="flex flex-col items-center justify-center gap-4 mt-8 animate-fadeInSlow sm:flex-row">
          {/* Button */}
          <button
            className="px-6 py-3 bg-dream-indigo text-white font-semibold rounded-full 
               hover:bg-dream-indigo hover:scale-105 transition-transform duration-200 
               drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] w-full sm:w-auto"
            onClick={() => (window.location.href = "/get-started")}
          >
            Create
          </button>

          {/* Input */}
          <form className="flex flex-row items-center w-full sm:w-auto">
            <input
              type="text"
              placeholder="Hey DreamScape, create mountains..."
              className="px-6 py-3 bg-white/10 border border-white/15 text-dream-text rounded-full 
                 focus:outline-none focus:ring-2 focus:ring-dream-indigo focus:border-transparent 
                 placeholder-dream-text/50 w-full sm:w-72 md:w-96"
            />
          </form>
        </div>

      </div>
    </div>
  );
}
