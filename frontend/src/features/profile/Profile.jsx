import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useForm } from "../../hooks/useForm";

export default function Profile() {
  const { user, loading, error, updateSuccess, handleUpdateProfile, handleFetchProfile, handleClearError, handleClearUpdateSuccess } = useAuth();
  const [form, handleChange, , setValues] = useForm({ name: "", username: "", email: "" });

  useEffect(() => {
    if (user) setValues({ name: user.name || "", username: user.username || "", email: user.email || "" });
    else handleFetchProfile();
    return () => { handleClearError(); handleClearUpdateSuccess(); };
  }, [user?.id]); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleUpdateProfile({ name: form.name, username: form.username });
  };

  if (!user) return null;
  const initials = (user.name || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors no-underline">
        ← Back to Dashboard
      </Link>

      {/* Avatar card */}
      <div className="glass animate-fade-up p-10 mb-4 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white mx-auto mb-4 shadow-[0_8px_32px_rgba(59,130,246,0.35)]">
          {initials}
        </div>
        <h2 className="text-xl mb-0.5">{user.name}</h2>
        <p className="text-slate-400">@{user.username}</p>

        <div className="flex justify-center gap-4 mt-6">
          <div className="glass-card px-6 py-3 text-center">
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-xs text-slate-400 mt-0.5">Calls Made</div>
          </div>
          <div className="glass-card px-6 py-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">Online</div>
            <div className="text-xs text-slate-400 mt-0.5">Status</div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="glass animate-fade-up p-8">
        <h3 className="text-lg pb-4 mb-6 border-b border-white/10">Edit Profile</h3>

        {updateSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg px-4 py-3 text-sm mb-4">
            ✓ Profile updated successfully!
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="name" className="block text-slate-400 text-sm mb-1.5">Display Name</label>
            <input id="name" name="name" type="text" className="tf-input" value={form.name} onChange={handleChange} required minLength={3} />
          </div>
          <div>
            <label htmlFor="username" className="block text-slate-400 text-sm mb-1.5">Username</label>
            <input id="username" name="username" type="text" className="tf-input" value={form.username} onChange={handleChange} required minLength={6} />
          </div>
          <div>
            <label htmlFor="email" className="block text-slate-400 text-sm mb-1.5">
              Email <span className="text-xs text-slate-500">(cannot be changed)</span>
            </label>
            <input id="email" name="email" type="email" className="tf-input opacity-50 cursor-not-allowed" value={form.email} disabled />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:scale-[1.01]"
          >
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
