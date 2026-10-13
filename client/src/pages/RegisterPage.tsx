import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Siren, User, Mail, Lock, ArrowRight, AlertCircle, Shield } from 'lucide-react';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Dispatcher');
  const [department, setDepartment] = useState('Metro Emergency Operations Center');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        department
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,240,255,0.15),rgba(255,255,255,0))]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-xl shadow-cyan-500/20 mb-2">
            <Siren className="w-7 h-7 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            RescueRoute<span className="text-cyan-400">.AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Emergency Field Agent & Dispatcher Onboarding
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-navy-900/90 border border-navy-750 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-navy-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Register Operations Profile
            </span>
            <span className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>ROLE-BASED AUTH</span>
            </span>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name & Rank
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Officer Elena Rostova"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="e.rostova@metro-ems.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tactical Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-navy-950 border border-navy-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Lead Dispatcher">Lead Dispatcher</option>
                  <option value="Paramedic Crew Chief">Paramedic Crew Chief</option>
                  <option value="Fleet Commander">Fleet Commander</option>
                  <option value="Trauma Coordinator">Trauma Coordinator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-navy-950 border border-navy-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-navy-950 border border-navy-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Registering Tactical Account...</span>
              ) : (
                <>
                  <span>Create Account & Access Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Already have an authorized profile? <strong className="text-white underline">Sign In</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
