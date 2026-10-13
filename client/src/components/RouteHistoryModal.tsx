import React, { useState, useEffect } from 'react';
import { RouteHistoryItem } from '../types';
import { api } from '../services/api';
import { Clock, X, ShieldCheck, User, Calendar } from 'lucide-react';

interface RouteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RouteHistoryModal: React.FC<RouteHistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [history, setHistory] = useState<RouteHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.getRouteHistory();
        setHistory(res.history);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-800 bg-navy-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-mono">
                Dispatched Emergency Route History
              </h2>
              <p className="text-xs text-slate-400">
                Audited dispatch log with telemetry and roadblock avoidance records
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading dispatch logs...
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No emergency routes dispatched yet. Plan and dispatch a route to record history.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-navy-950/80 border border-navy-800 hover:border-navy-700 transition-all text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-navy-800/60">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-cyan-400 font-mono text-sm">
                      {item.selectedRouteName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-navy-900 text-slate-300 border border-navy-750">
                      {item.emergencyType}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500">Origin:</span>{' '}
                    <strong>{item.originName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Destination:</span>{' '}
                    <strong className="text-cyan-300">{item.destinationName}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <div>
                    ETA: <strong className="text-white">{item.durationMinutes} mins</strong>
                  </div>
                  <div>
                    Distance: <strong className="text-white">{item.distanceKm} km</strong>
                  </div>
                  {item.incidentsAvoided > 0 && (
                    <div className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{item.incidentsAvoided} Hazards Avoided</span>
                    </div>
                  )}
                  {item.user && (
                    <div className="text-slate-400 flex items-center space-x-1">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>Dispatcher: {item.user.name}</span>
                    </div>
                  )}
                </div>

                {item.aiExplanation && (
                  <div className="p-2.5 rounded-lg bg-navy-900/60 border border-navy-800 text-[11px] text-slate-300">
                    <span className="text-cyan-400 font-semibold font-mono">
                      Tactical Briefing:{' '}
                    </span>
                    {typeof item.aiExplanation === 'string' &&
                    item.aiExplanation.startsWith('{')
                      ? JSON.parse(item.aiExplanation).summary
                      : item.aiExplanation}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
