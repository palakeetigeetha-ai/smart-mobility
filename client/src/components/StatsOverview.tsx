import React from 'react';
import { ShieldAlert, Zap, Hospital, Navigation } from 'lucide-react';
import { DashboardStats } from '../types';

interface StatsOverviewProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, loading }) => {
  const cards = [
    {
      title: 'Active Roadblocks',
      value: stats ? stats.activeIncidents : '--',
      subtitle: `${stats?.criticalAlerts || 0} critical bottlenecks`,
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/40 border-rose-800/50 text-rose-300',
      glow: 'shadow-rose-900/10'
    },
    {
      title: 'Response Time Saved',
      value: stats ? `~${stats.avgResponseTimeSavedMinutes}m` : '--',
      subtitle: 'vs congested standard routes',
      icon: Zap,
      iconColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-950/40 border-cyan-800/50 text-cyan-300',
      glow: 'shadow-cyan-900/10'
    },
    {
      title: 'Dispatched Routes',
      value: stats ? stats.totalRoutesDispatched : '--',
      subtitle: 'Trauma vectors cleared',
      icon: Navigation,
      iconColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300',
      glow: 'shadow-emerald-900/10'
    },
    {
      title: 'Trauma Hubs Online',
      value: stats ? stats.monitoredHospitals : '--',
      subtitle: 'Active emergency triage',
      icon: Hospital,
      iconColor: 'text-blue-400',
      badgeBg: 'bg-blue-950/40 border-blue-800/50 text-blue-300',
      glow: 'shadow-blue-900/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="relative overflow-hidden rounded-xl bg-navy-900/90 border border-navy-750 p-3 sm:p-4 hover:border-navy-600 transition-all duration-200 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg bg-navy-800/80 border border-navy-700/60`}>
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>

            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
                {loading ? (
                  <span className="inline-block w-12 h-7 bg-navy-800 animate-pulse rounded"></span>
                ) : (
                  card.value
                )}
              </span>
            </div>

            <p className="mt-1 text-[11px] text-slate-400 truncate">
              {card.subtitle}
            </p>

            <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-cyan-500/5 pointer-events-none blur-xl" />
          </div>
        );
      })}
    </div>
  );
};
