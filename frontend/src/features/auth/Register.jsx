import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useForm } from "../../hooks/useForm";

export default function Register() {
  const { handleRegister, loading, error, handleClearError } = useAuth();
  const [form, handleChange] = useForm({ name: "", username: "", email: "", password: "" });

  useEffect(() => { handleClearError(); }, []); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleRegister(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="glass animate-fade-up w-full max-w-md p-6 md:p-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            TalkFusion
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Create your account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { id: "name",     label: "Display Name", type: "text",     ph: "John Doe",        min: 3 },
            { id: "username", label: "Username",      type: "text",     ph: "johndoe",         min: 6 },
            { id: "email",    label: "Email",         type: "email",    ph: "you@example.com"        },
            { id: "password", label: "Password",      type: "password", ph: "Min. 6 characters", min: 6 },
          ].map(({ id, label, type, ph, min }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-slate-400 text-sm mb-1.5">{label}</label>
              <input
                id={id} name={id} type={type}
                className="tf-input"
                value={form[id]} onChange={handleChange}
                placeholder={ph} required minLength={min}
                autoComplete={id === "password" ? "new-password" : id}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-400 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
