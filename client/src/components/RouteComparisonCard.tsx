import React, { useState } from 'react';
import { RouteOption } from '../types';
import {
  ShieldAlert,
  Navigation,
  Zap,
  AlertTriangle,
  Send
} from 'lucide-react';

interface RouteComparisonCardProps {
  routes: RouteOption[];
  recommendedRouteId: string;
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  onDispatchRoute: (route: RouteOption) => Promise<void>;
  dispatching: boolean;
}

export const RouteComparisonCard: React.FC<RouteComparisonCardProps> = ({
  routes,
  recommendedRouteId,
  selectedRouteId,
  onSelectRoute,
  onDispatchRoute,
  dispatching
}) => {
  const [dispatchedRouteId, setDispatchedRouteId] = useState<string | null>(null);

  const handleDispatch = async (route: RouteOption) => {
    setDispatchedRouteId(route.id);
    await onDispatchRoute(route);
  };

  if (!routes || routes.length === 0) {
    return (
      <div className="rounded-2xl bg-navy-900/60 border border-navy-800 p-8 text-center text-slate-400">
        <Navigation className="w-8 h-8 mx-auto mb-2 text-navy-600 animate-pulse" />
        <p className="text-sm font-medium">Select origin & destination to compute tactical corridors</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-2">
          <span>Corridor Evaluation Matrix</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-navy-800 text-cyan-400 border border-navy-700">
            {routes.length} Vectors Scored
          </span>
        </h3>
        <span className="text-[11px] text-slate-400">Click route to inspect path on tactical map</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {routes.map((route) => {
          const isRecommended = route.id === recommendedRouteId;
          const isSelected = route.id === selectedRouteId;
          const isBlocked = route.blocked;

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`relative rounded-xl transition-all cursor-pointer p-3.5 flex flex-col justify-between border ${
                isSelected
                  ? 'bg-navy-850/95 border-cyan-500 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500'
                  : 'bg-navy-900/80 border-navy-750 hover:border-navy-600'
              }`}
            >
              {/* Header Badges */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-xs font-bold ${
                        isBlocked ? 'text-rose-400' : isSelected ? 'text-cyan-300' : 'text-white'
                      }`}
                    >
                      {route.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{route.tagline}</p>
                </div>

                {isRecommended && !isBlocked && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-700/80 uppercase tracking-wider shrink-0 flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>Best Pick</span>
                  </span>
                )}

                {isBlocked && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800/80 uppercase tracking-wider shrink-0 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>Blocked</span>
                  </span>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-navy-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Estimated ETA</span>
                  <div className="flex items-baseline space-x-1">
                    <span
                      className={`text-xl font-bold font-mono ${
                        isBlocked ? 'text-rose-400' : 'text-white'
                      }`}
                    >
                      {route.durationMinutes}
                    </span>
                    <span className="text-[10px] text-slate-400">mins</span>
                  </div>
                  {route.delayMinutes > 0 && (
                    <div className="text-[10px] text-rose-400 font-mono">
                      +{route.delayMinutes}m delay
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Distance</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-bold font-mono text-white">
                      {route.distanceKm}
                    </span>
                    <span className="text-[10px] text-slate-400">km</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Base: {route.baseDurationMinutes}m
                  </div>
                </div>
              </div>

              {/* Suitability Score Bar */}
              <div className="my-1.5">
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-slate-400 uppercase">Suitability Index</span>
                  <span
                    className={`font-mono font-bold ${
                      route.score > 80
                        ? 'text-cyan-400'
                        : route.score > 50
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {route.score} / 100
                  </span>
                </div>
                <div className="w-full h-1.5 bg-navy-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      route.score > 80
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                        : route.score > 50
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(8, route.score)}%` }}
                  />
                </div>
              </div>

              {/* Collision alert or Highlights */}
              {isBlocked ? (
                <div className="mt-2 p-2 rounded-lg bg-rose-950/40 border border-rose-900/60 text-[10px] text-rose-300">
                  <div className="font-semibold flex items-center space-x-1">
                    <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>Collides with Active Roadblock:</span>
                  </div>
                  <div className="mt-0.5 truncate font-mono">
                    {route.blockingIncidents[0]?.title}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-[10px] text-slate-400 space-y-0.5 line-clamp-2">
                  {route.summaryHighlights[0]}
                </div>
              )}

              {/* Dispatch Action */}
              <button
                type="button"
                disabled={isBlocked || (dispatching && dispatchedRouteId === route.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDispatch(route);
                }}
                className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  isBlocked
                    ? 'bg-navy-950/50 text-slate-500 border border-navy-800 cursor-not-allowed'
                    : isSelected
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700'
                }`}
              >
                {isBlocked ? (
                  <span>Route Ineligible (Blocked)</span>
                ) : dispatching && dispatchedRouteId === route.id ? (
                  <span>Dispatching Unit...</span>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Dispatch This Corridor</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
