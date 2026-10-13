import React, { useState } from 'react';
import {
  AIExplanation,
  RouteOption,
  RouteComparisonData,
  RecoveryRecommendationData
} from '../types';
import { api } from '../services/api';
import {
  Sparkles,
  Radio,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface AIExplanationCardProps {
  explanation: AIExplanation | null;
  loading?: boolean;
  originName?: string;
  destinationName?: string;
  emergencyType?: string;
  routes?: RouteOption[];
  rerouteNotice?: {
    originalBlockedRoute: string;
    incidentCausingDetour: string;
    recommendedAlternative: string;
    timeSavedMinutes: number;
  };
}

export const AIExplanationCard: React.FC<AIExplanationCardProps> = ({
  explanation,
  loading,
  originName,
  destinationName,
  emergencyType,
  routes,
  rerouteNotice
}) => {
  const [activeTab, setActiveTab] = useState<'briefing' | 'comparison' | 'recovery'>('briefing');
  const [comparisonData, setComparisonData] = useState<RouteComparisonData | null>(null);
  const [recoveryData, setRecoveryData] = useState<RecoveryRecommendationData | null>(null);
  const [fetchingExtra, setFetchingExtra] = useState(false);

  if (loading) {
    return (
      <div className="rounded-2xl bg-navy-900/90 border border-navy-750 p-5 shadow-xl animate-pulse">
        <div className="h-4 w-48 bg-navy-800 rounded mb-4"></div>
        <div className="h-16 bg-navy-800 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-navy-800 rounded"></div>
          <div className="h-3 bg-navy-800 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!explanation) return null;

  const handleFetchComparison = async () => {
    setActiveTab('comparison');
    if (comparisonData || !routes || !originName || !destinationName) return;
    setFetchingExtra(true);
    try {
      const res = await api.compareRoutes({
        originName,
        destinationName,
        emergencyType: emergencyType || 'Code 3 - Critical Trauma',
        routes
      });
      setComparisonData(res.comparison);
    } catch (err) {
      console.warn('Could not load AI comparison:', err);
    } finally {
      setFetchingExtra(false);
    }
  };

  const handleFetchRecovery = async () => {
    setActiveTab('recovery');
    if (recoveryData) return;
    setFetchingExtra(true);
    try {
      const blocked = routes?.filter((r) => r.blocked).map((r) => r.name) || [];
      const openAlts = routes?.filter((r) => !r.blocked).map((r) => r.name) || [];
      const res = await api.getRecoveryRecommendations({
        incidentTitle: rerouteNotice?.incidentCausingDetour || 'Active Regional Congestion Bottleneck',
        locationName: originName ? `${originName} Corridor` : 'Metro Arterial',
        severity: rerouteNotice ? 'CRITICAL' : 'MODERATE',
        clearedOrActive: rerouteNotice ? 'ACTIVE' : 'CLEARED',
        blockedCorridors: blocked,
        availableAlternatives: openAlts
      });
      setRecoveryData(res.recovery);
    } catch (err) {
      console.warn('Could not load AI recovery recommendations:', err);
    } finally {
      setFetchingExtra(false);
    }
  };

  const isGemini = explanation.provider === 'GEMINI_AI';

  return (
    <div className="rounded-2xl bg-gradient-to-br from-navy-900/95 via-navy-850 to-navy-900 border border-cyan-900/40 p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Decorative Cyber Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-navy-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              AI Tactical Dispatch Intelligence
            </h3>
            <p className="text-[10px] text-slate-400">
              Autonomous risk analysis, corridor comparisons & recovery guidance
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1.5 bg-navy-950 p-1 rounded-xl border border-navy-800">
          <button
            type="button"
            onClick={() => setActiveTab('briefing')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === 'briefing'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tactical Briefing
          </button>

          <button
            type="button"
            onClick={handleFetchComparison}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === 'comparison'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Corridor Comparison
          </button>

          <button
            type="button"
            onClick={handleFetchRecovery}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === 'recovery'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Recovery Advisory
          </button>
        </div>

        {/* Provider Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-navy-950 border border-cyan-800/80 text-cyan-300">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span>{isGemini ? 'Gemini 1.5 Flash AI' : 'Tactical Fallback Engine'}</span>
        </div>
      </div>

      {fetchingExtra && (
        <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Generating tactical intelligence briefing...</span>
        </div>
      )}

      {/* TAB 1: Tactical Briefing & Risk Explanation */}
      {activeTab === 'briefing' && !fetchingExtra && (
        <div className="mt-3 space-y-3">
          <div className="p-3 rounded-xl bg-navy-950/70 border border-navy-800">
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {explanation.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Key Strategic Rationale */}
            <div className="p-3 rounded-xl bg-navy-950/50 border border-navy-800/80">
              <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center space-x-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Strategic Optimization Factors</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                {explanation.rationale.map((point, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-cyan-400 font-bold shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Crew Instructions & Hazards */}
            <div className="p-3 rounded-xl bg-navy-950/50 border border-navy-800/80">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center space-x-1.5 font-mono">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Crew Guidance & Hazard Clearance</span>
              </div>

              <div className="p-2 rounded-lg bg-navy-900/90 border border-navy-750 text-[11px] text-slate-300 mb-2">
                <strong className="text-emerald-300">Transit Protocol:</strong>{' '}
                {explanation.crewGuidance}
              </div>

              <div className="text-[10px] text-slate-400">
                <strong className="text-rose-400">Hazard Clearance:</strong>
                <ul className="mt-0.5 space-y-0.5">
                  {explanation.hazardsMitigated.map((h, i) => (
                    <li key={i} className="text-slate-300">
                      🛡️ {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Deep Route Comparison */}
      {activeTab === 'comparison' && !fetchingExtra && comparisonData && (
        <div className="mt-3 space-y-3">
          <div className="p-3 rounded-xl bg-navy-950/70 border border-navy-800 text-xs text-slate-300">
            <span className="font-bold text-cyan-400 uppercase font-mono mr-2">
              Executive Evaluation:
            </span>
            {comparisonData.overview}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {comparisonData.comparisons.map((c, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-navy-950/60 border border-navy-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{c.routeName}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      c.patientRiskLevel === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : c.patientRiskLevel === 'HIGH'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {c.patientRiskLevel} RISK
                  </span>
                </div>
                <div className="text-[11px] text-cyan-300 font-medium">
                  {c.strategicVerdict}
                </div>
                <div className="text-[10px] text-slate-300">
                  <b className="text-emerald-400">Advantage:</b> {c.keyAdvantage}
                </div>
                <div className="text-[10px] text-slate-400">
                  <b className="text-rose-400">Trade-off:</b> {c.keyDrawback}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-xl bg-navy-950/40 border border-navy-800/80 text-[11px] text-slate-300">
            <strong className="text-amber-400 font-mono">Tactical Trade-offs:</strong>
            <ul className="mt-1 space-y-1">
              {comparisonData.tacticalTradeoffs.map((t, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-amber-400 shrink-0">→</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: Roadblock Recovery Advisory */}
      {activeTab === 'recovery' && !fetchingExtra && recoveryData && (
        <div className="mt-3 space-y-3">
          <div className="p-3 rounded-xl bg-navy-950/70 border border-navy-800 text-xs text-slate-300">
            <span className="font-bold text-emerald-400 uppercase font-mono mr-2">
              Recovery Status:
            </span>
            {recoveryData.operationalStatus}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-navy-950/50 border border-navy-800/80">
              <span className="font-bold text-cyan-400 uppercase font-mono text-[11px] block mb-2">
                Immediate Incident Action Items
              </span>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                {recoveryData.actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-cyan-400 font-bold shrink-0">✔</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-navy-950/50 border border-navy-800/80 space-y-2 text-[11px] text-slate-300">
              <div>
                <strong className="text-amber-400 block font-mono">
                  Signal Preemption Protocol:
                </strong>
                <span>{recoveryData.trafficSignalPreemptionGuidance}</span>
              </div>
              <div>
                <strong className="text-cyan-400 block font-mono">
                  Trauma Bay Preparation:
                </strong>
                <span>{recoveryData.traumaCenterPreparationNotice}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
