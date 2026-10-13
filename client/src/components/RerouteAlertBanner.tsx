import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface RerouteAlertBannerProps {
  rerouteNotice?: {
    originalBlockedRoute: string;
    incidentCausingDetour: string;
    recommendedAlternative: string;
    timeSavedMinutes: number;
  };
  onFocusRecommended: () => void;
}

export const RerouteAlertBanner: React.FC<RerouteAlertBannerProps> = ({
  rerouteNotice,
  onFocusRecommended
}) => {
  if (!rerouteNotice) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-rose-600/80 bg-gradient-to-r from-rose-950/80 via-navy-900 to-navy-900 p-4 shadow-xl shadow-rose-950/40 animate-pulse-fast">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-rose-900/60 border border-rose-700 text-rose-300 shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">
                CRITICAL ROADBLOCK COLLISION DETECTED
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-900/80 text-rose-200 border border-rose-700">
                ACTIVE REROUTE
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1">
              Standard vector <strong className="text-rose-300">{rerouteNotice.originalBlockedRoute}</strong> is
              impassable due to <span className="underline decoration-rose-500 font-medium">{rerouteNotice.incidentCausingDetour}</span>.
            </p>
            <p className="text-[11px] text-cyan-300 mt-0.5">
              Autonomous switch to <strong>{rerouteNotice.recommendedAlternative}</strong> deployed.
              Estimated delay reduction: <strong>+{rerouteNotice.timeSavedMinutes} minutes</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onFocusRecommended}
          className="self-start sm:self-center px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-rose-900/50 transition-all shrink-0 cursor-pointer"
        >
          <span>Acknowledge & Inspect Vector</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
