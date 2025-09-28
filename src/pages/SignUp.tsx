import { useState } from "react";
import supabase from "../lib/supabase";

import { Facebook, Instagram,Linkedin } from "lucide-react";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  }

 
 return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dreamscape gap-11">
     
        <h1 className=" text-center p-5 relative z-10 font-display font-bold text-8xl text-center bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
          
          Sign Up
        </h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {success && (
          <p className="text-green-400 text-sm mb-4">
            Check your email to confirm your account ✨
          </p>
        )}
        <form onSubmit={handleSignUp} className="flex flex-col gap-3">
          <label
      htmlFor="email"
      className="mb-2 text-sm font-san text-xl text-dream-text translate-y-5"
    >
      Email
    </label>
          <input
            type="email"
            placeholder=" Enter your email"
            className="px-4 py-3 w-[500px]
            rounded-4xl
            bg-white/20 backdrop-blur-md
            border border-white/15
            text-white font-sans
            placeholder-white/50
            focus:outline-none focus:ring-2 focus:ring-dream-indigo
            shadow-md shadow-black/30"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label
      htmlFor="password"
      className=" mb-2 text-sm font-san text-xl text-dream-text -translate-y-1 "
    >
      Password
    </label>
          <input
            type="password"
            placeholder="Enter your password"
            className=" -translate-y-6 px-4 py-3 w-[500px]
              rounded-4xl
             bg-white/20 backdrop-blur-md
            border border-white/15
            text-white font-sans
            placeholder-white/50
            focus:outline-none focus:ring-2 focus:ring-dream-pink
            shadow-md shadow-black/30
            
            "
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className=" 
            -translate-y-6
            mrelative mt-4 w-[150px] mx-auto text-center
            rounded-full px-6 py-2
            text-white font-sans
             bg-dream-indigo 
            // backdrop-blur-md
            before:absolute before:inset-0
            before:rounded-full
            before:p-[1px]                /* border thickness */
            before:content-[''] before:-z-10
            shadow-lg shadow-black/5
            
           border border-white/15 
            transition
            font-semibold
            cursor-pointer
            transition-all duration-200 ease-in-out
            hover:scale-105 hover:bg-dream-pink hover:border-dream-pink hover:text-dream-white
            hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]            

            "
                 
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
        <div className=" flex flex-row gap-5 w-50 h-auto  ">
        
            <Facebook className="w-full h-full"/>  
            <Instagram className="w-full h-full"/> 
            <Linkedin className="w-full h-full"/>

        </div>

          
                <p className="text-center text-sm text-dream-text/70 mt-4 font-body">
               
          Already have an account?{" "}
          <a href="/login" className="text-dream-pink hover:underline">
            Log in
          </a>
        </p>
      </div>
    
  );
}
