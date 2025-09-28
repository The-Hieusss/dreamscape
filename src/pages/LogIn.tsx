import { useState } from "react";
import supabase from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/home"; // redirect after login
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-dreamscape">
      <div className="bg-black/40 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
        <h1 className="font-display text-4xl text-dream-cyan text-center mb-6">
          Welcome Back
        </h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="px-4 py-3 rounded-lg bg-black/60 text-dream-text font-body placeholder-dream-text/50 focus:outline-none focus:ring-2 focus:ring-dream-indigo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="px-4 py-3 rounded-lg bg-black/60 text-dream-text font-body placeholder-dream-text/50 focus:outline-none focus:ring-2 focus:ring-dream-pink"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn-dream-cyan mt-4 w-full"
            disabled={loading}
          >
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>
        <p className="text-center text-sm text-dream-text/70 mt-4 font-body">
          Don’t have an account?{" "}
          <a href="/signup" className="text-dream-indigo hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
