import { useState } from "react";
import supabase from "../lib/supabase";
import { Facebook, Instagram, Linkedin, Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else window.location.href = "/home";
  }

  const valid = email.length > 3 && password.length >= 6;

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4 py-10 bg-[radial-gradient(circle_at_30%_20%,#312e81,transparent_60%),radial-gradient(circle_at_70%_80%,#4c1d95,transparent_55%)] bg-slate-950">
      {/* Animated gradient veil */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_40%)] mix-blend-overlay" />
      {/* Particles (simple) */}
      <div className="absolute inset-0 opacity-[0.12] bg-[url('/noise.png')] mix-blend-soft-light" />

      <div className="w-full max-w-md md:max-w-lg relative">
        <h1 className="text-center font-display font-bold text-4xl md:text-6xl bg-gradient-to-r from-pink-200 via-purple-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-sm mb-8">
          Welcome Back
        </h1>

        <div className="rounded-3xl p-6 md:p-8 backdrop-blur-2xl bg-white/8 border border-white/15 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.15)]">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-3 py-2">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs uppercase tracking-wide font-semibold text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                className="w-full rounded-xl px-4 py-3 bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-dream-indigo/70 focus:border-transparent transition"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center justify-between text-xs uppercase tracking-wide font-semibold text-slate-300 mb-2">
                <span>Password</span>
                <a href="/reset" className="text-[11px] text-dream-pink hover:underline">
                  Forgot?
                </a>
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full rounded-xl px-4 py-3 pr-11 bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-dream-pink/70 focus:border-transparent transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  aria-label={showPass ? "Hide password" : "Show password"}
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-300 hover:text-white"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!valid || loading}
              className="w-full group relative overflow-hidden rounded-full px-6 py-3 font-semibold text-sm tracking-wide
              text-white bg-gradient-to-r from-dream-indigo via-fuchsia-600 to-dream-pink
              enabled:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_8px_32px_-6px_rgba(236,72,153,0.55)]
              enabled:hover:scale-[1.02] active:scale-95 transition disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="animate-spin h-4 w-4" /> Logging in...
                </span>
              ) : (
                "Login"
              )}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition" />
            </button>
          </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <span className="text-[11px] uppercase tracking-wider text-slate-400">
                Or continue with
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-3 gap-4">
              <SocialButton label="Facebook">
                <Facebook className="w-5 h-5" />
              </SocialButton>
              <SocialButton label="Instagram">
                <Instagram className="w-5 h-5" />
              </SocialButton>
              <SocialButton label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </SocialButton>
            </div>

            <p className="mt-8 text-center text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <a
                href="/signup"
                className="text-dream-pink hover:underline font-medium"
              >
                Sign up
              </a>
            </p>
        </div>
      </div>
    </div>
  );
}

function SocialButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex items-center justify-center gap-2 rounded-xl py-3 bg-white/10 hover:bg-white/20 border border-white/15 text-white transition group focus:outline-none focus:ring-2 focus:ring-pink-400/60"
    >
      {children}
    </button>
  );
}

