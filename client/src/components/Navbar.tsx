import React from 'react';
import { Siren, LogOut, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenHistory: () => void;
  onOpenIncidents: () => void;
  activeIncidentsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHistory,
  onOpenIncidents,
  activeIncidentsCount
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-navy-950/85 backdrop-blur-md border-b border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tactical Identity */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-lg shadow-cyan-500/20">
              <Siren className="w-5 h-5 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-mono">
                  RescueRoute<span className="text-cyan-400">.AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  TACTICAL OPS
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Autonomous Emergency Dynamic Rerouting & Trauma Corridors
              </p>
            </div>
          </div>

          {/* Center Status Pill */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-navy-900 border border-navy-700/60 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">SENTINEL RADAR ACTIVE</span>
            <span className="text-navy-600">|</span>
            <span className="text-cyan-400 font-mono text-[11px]">SUPABASE READY</span>
            <span className="text-navy-600">|</span>
            <span className="text-emerald-400 font-mono text-[11px]">GEMINI AI ENABLED</span>
          </div>

          {/* Right Navigation & User Controls */}
          <div className="flex items-center space-x-3">
            {/* Incident Manager Trigger */}
            <button
              onClick={onOpenIncidents}
              className="relative flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-slate-200 border border-navy-700 text-xs font-medium transition-all"
              title="Manage Roadblocks & Incidents"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Roadblocks</span>
              {activeIncidentsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {activeIncidentsCount}
                </span>
              )}
            </button>

            {/* Route History Trigger */}
            <button
              onClick={onOpenHistory}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-slate-200 border border-navy-700 text-xs font-medium transition-all"
              title="Dispatched Route History"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">History</span>
            </button>

            {/* User Profile & Logout */}
            {user ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-navy-800">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-semibold text-white">{user.name}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg bg-navy-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-navy-700 hover:border-rose-800/60 transition-all"
                  title="Sign out of console"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
