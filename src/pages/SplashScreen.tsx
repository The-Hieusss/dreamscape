import SplitText from "../components/ui/SplitText";

const handleAnimationComplete = () => {
  console.log("All letters have animated!");
};

export default function SplashScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-dreamscape animate-fadeIn">
      <div className="flex flex-col items-center text-center">
        <h1 className="font-display text-dream-indigo text-[3.5rem] sm:text-[5rem] md:text-[7rem] leading-none drop-shadow-lg relative overflow-hidden">
          <SplitText
            text="DreamScape."
            className="text-dream-indigo"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            onLetterAnimationComplete={handleAnimationComplete}
          />
        </h1>
        <p className="mt-4 font-body text-dream-text text-base sm:text-lg md:text-xl animate-fadeInSlow">
          Make your dreams come true
        </p>
      </div>
    </div>
  );
}
