import { useState } from "react";
import supabase from "../lib/supabase";

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
    <div className="flex items-center justify-center min-h-screen bg-dreamscape">
      <div className="bg-black/40 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
        <h1 className="font-display text-4xl text-dream-indigo text-center mb-6">
          Create Account
        </h1>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {success && (
          <p className="text-green-400 text-sm mb-4">
            Check your email to confirm your account ✨
          </p>
        )}
        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
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
            className="btn-dream-indigo mt-4 w-full"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
        <p className="text-center text-sm text-dream-text/70 mt-4 font-body">
          Already have an account?{" "}
          <a href="/login" className="text-dream-pink hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
