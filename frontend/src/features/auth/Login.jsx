import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useForm } from "../../hooks/useForm";

export default function Login() {
  const { handleLogin, loading, error, handleClearError } = useAuth();
  const [form, handleChange] = useForm({ email: "", password: "" });

  useEffect(() => { handleClearError(); }, []); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="glass animate-fade-up w-full max-w-md p-6 md:p-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            TalkFusion
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Welcome back</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="block text-slate-400 text-sm mb-1.5">
              Email
            </label>
            <input
              id="email" name="email" type="email"
              className="tf-input"
              value={form.email} onChange={handleChange}
              placeholder="you@example.com" required autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-slate-400 text-sm mb-1.5">
              Password
            </label>
            <input
              id="password" name="password" type="password"
              className="tf-input"
              value={form.password} onChange={handleChange}
              placeholder="••••••••" required autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            {loading ? "Signing in…" : "Log In"}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-400 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
