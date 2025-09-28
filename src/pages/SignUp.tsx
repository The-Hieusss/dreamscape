import { useState, useEffect } from "react";
import supabase from "../lib/supabase";
import {
  Facebook,
  Instagram,
  Linkedin,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess(true);
  }

  // Optional auto-focus
  useEffect(() => {
    const el = document.getElementById("email");
    el?.focus();
  }, []);

  const pwScore =
    password.length === 0
      ? 0
      : password.length < 6
      ? 1
      : /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
      ? 4
      : /[A-Z]/.test(password) && /\d/.test(password)
      ? 3
      : 2;

  const pwColors = ["bg-slate-600/40", "bg-red-500", "bg-amber-400", "bg-indigo-400", "bg-emerald-400"];
  const pwLabels = ["", "Weak", "Okay", "Good", "Strong"];
  const valid = email.length > 3 && password.length >= 6;

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4 py-10 bg-[radial-gradient(circle_at_25%_20%,#312e81,transparent_60%),radial-gradient(circle_at_75%_80%,#4c1d95,transparent_55%)] bg-slate-950">
      {/* Ambient layers */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.06),rgba(255,255,255,0)_45%)] mix-blend-overlay" />
      <div className="absolute inset-0 opacity-[0.10] bg-[url('/noise.png')] mix-blend-soft-light" />

      <div className="w-full max-w-lg relative">
        <h1 className="text-center font-display font-bold text-5xl md:text-6xl bg-gradient-to-r from-pink-200 via-purple-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-sm mb-8">
          Create Account
        </h1>

        <div className="rounded-3xl p-6 md:p-8 backdrop-blur-2xl bg-white/8 border border-white/15 shadow-[0_8px_42px_-14px_rgba(0,0,0,0.65),inset_0_0_0_1px_rgba(255,255,255,0.11)]">
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>Check your email to confirm your account ✨</span>
            </div>
          )}

            <form onSubmit={handleSignUp} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold tracking-wide uppercase text-slate-300"
                >
                  Email
                </label>
                <input
                  id="email"
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold tracking-wide uppercase text-slate-300"
                  >
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Min 6 chars
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="new-password"
                    className="w-full rounded-xl px-4 py-3 pr-12 bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-dream-pink/70 focus:border-transparent transition"
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

                {/* Strength meter */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition ${
                        i <= pwScore ? pwColors[pwScore] : "bg-white/10"
                      }`}
                    />
                  ))}
                  <span
                    className={`text-[11px] font-medium ${
                      pwScore >= 3
                        ? "text-emerald-300"
                        : pwScore === 2
                        ? "text-amber-300"
                        : pwScore === 1
                        ? "text-red-300"
                        : "text-slate-400"
                    }`}
                  >
                    {pwLabels[pwScore]}
                  </span>
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
                    <Loader2 className="animate-spin h-4 w-4" /> Signing up...
                  </span>
                ) : (
                  "Sign Up"
                )}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-15 bg-white transition" />
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
            Already have an account?{" "}
            <a
              href="/login"
              className="text-dream-pink hover:underline font-medium"
            >
              Log in
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
