import React, { useState } from 'react';
import { Incident, IncidentSummaryData } from '../types';
import { api } from '../services/api';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  Trash2,
  X,
  Sparkles
} from 'lucide-react';

interface IncidentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  onRefreshIncidents: () => Promise<void>;
  onIncidentUpdated: () => void;
}

const ROADBLOCK_PRESETS = [
  {
    title: 'Interstate Multi-Vehicle Catastrophe',
    locationName: 'US-101 Northbound & Cesar Chavez Exit',
    latitude: 37.7505,
    longitude: -122.4065,
    severity: 'CRITICAL',
    category: 'ROADBLOCK',
    radiusMeters: 350,
    description: 'Jackknifed 18-wheeler blocking all express lanes. Debris field spreading.'
  },
  {
    title: 'Critical Electrical Substation Explosion',
    locationName: '8th St & Brannan St Industrial Sector',
    latitude: 37.7725,
    longitude: -122.4042,
    severity: 'CRITICAL',
    category: 'INFRASTRUCTURE',
    radiusMeters: 300,
    description: 'Active transformer fire and high-voltage line collapse. Perimeter cordoned.'
  },
  {
    title: 'Flash Flood Storm Drain Failure',
    locationName: '14th St & Guerrero St Dip',
    latitude: 37.7682,
    longitude: -122.4239,
    severity: 'MAJOR',
    category: 'FLOODING',
    radiusMeters: 220,
    description: 'Asphalt covered in 0.6m standing water. Emergency vehicles stalling.'
  }
];

export const IncidentManager: React.FC<IncidentManagerProps> = ({
  isOpen,
  onClose,
  incidents,
  onRefreshIncidents,
  onIncidentUpdated
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [aiSummaries, setAiSummaries] = useState<Record<string, IncidentSummaryData>>({});
  const [loadingSummaryId, setLoadingSummaryId] = useState<string | null>(null);

  const handleGetAiSummary = async (inc: Incident) => {
    if (aiSummaries[inc.id]) {
      // Toggle off if already open
      const copy = { ...aiSummaries };
      delete copy[inc.id];
      setAiSummaries(copy);
      return;
    }
    setLoadingSummaryId(inc.id);
    try {
      const res = await api.summarizeIncident({
        title: inc.title,
        locationName: inc.locationName,
        severity: inc.severity,
        category: inc.category,
        radiusMeters: inc.radiusMeters,
        description: inc.description
      });
      setAiSummaries((prev) => ({ ...prev, [inc.id]: res.summary }));
    } catch (err: any) {
      console.warn('Could not load AI hazard summary:', err);
    } finally {
      setLoadingSummaryId(null);
    }
  };

  // Form states
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('37.7794');
  const [longitude, setLongitude] = useState('-122.4128');
  const [severity, setSeverity] = useState('CRITICAL');
  const [category, setCategory] = useState('ROADBLOCK');
  const [radiusMeters, setRadiusMeters] = useState('280');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof ROADBLOCK_PRESETS)[0]) => {
    setTitle(preset.title);
    setLocationName(preset.locationName);
    setLatitude(preset.latitude.toString());
    setLongitude(preset.longitude.toString());
    setSeverity(preset.severity);
    setCategory(preset.category);
    setRadiusMeters(preset.radiusMeters.toString());
    setDescription(preset.description);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setSubmitting(true);
    try {
      await api.createIncident({
        title,
        description: description || 'Simulated roadblock for emergency testing.',
        locationName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        severity,
        category,
        radiusMeters: parseInt(radiusMeters, 10) || 250
      });

      setShowAddForm(false);
      setTitle('');
      setLocationName('');
      setDescription('');
      await onRefreshIncidents();
      onIncidentUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create simulated roadblock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.toggleIncident(id);
      await onRefreshIncidents();
      onIncidentUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update incident status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteIncident(id);
      await onRefreshIncidents();
      onIncidentUpdated();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete incident');
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filter === 'ACTIVE') return inc.status === 'ACTIVE';
    if (filter === 'RESOLVED') return inc.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-800 bg-navy-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-950 border border-amber-800/60 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-mono">
                Incident & Simulated Roadblock Command
              </h2>
              <p className="text-xs text-slate-400">
                Trigger roadblocks to test automated corridor rerouting
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

        {/* Modal Action Bar */}
        <div className="px-5 py-3 border-b border-navy-800/80 flex flex-wrap items-center justify-between gap-2 bg-navy-900/50">
          <div className="flex items-center space-x-1.5">
            {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filter === mode
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-navy-950 text-slate-400 hover:text-white border border-navy-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-1.5 shadow-md shadow-amber-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancel Form' : 'Add Roadblock Hazard'}</span>
          </button>
        </div>

        {/* Error Alert */}
        {actionError && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            {actionError}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Add Roadblock Sub-Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-xl bg-navy-950 border border-amber-500/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase font-mono">
                  Inject Simulated Hazard
                </span>
                <span className="text-[10px] text-slate-400">
                  Fill coordinates or pick preset below
                </span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {ROADBLOCK_PRESETS.map((p, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded-md text-[10px] bg-navy-900 hover:bg-navy-800 text-slate-300 border border-navy-750 transition-colors"
                  >
                    ⚡ {p.title.split(' ')[0]} {p.title.split(' ')[1]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Incident Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Overturned Tanker on Market"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Location Name / Street
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5th & Mission Intersect"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-navy-900 border border-navy-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-navy-900 border border-navy-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-navy-900 border border-navy-700 text-xs text-white"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="MAJOR">MAJOR</option>
                    <option value="MODERATE">MODERATE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Description & Hazmat Details
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail road conditions and emergency barrier status"
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                {submitting ? (
                  <span>Deploying Roadblock to Grid...</span>
                ) : (
                  <span>Deploy Roadblock & Recalculate Routes</span>
                )}
              </button>
            </form>
          )}

          {/* List of Incidents */}
          {filteredIncidents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No incidents found matching current filter.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredIncidents.map((inc) => {
                const isCritical = inc.severity === 'CRITICAL';
                const isResolved = inc.status === 'RESOLVED';

                return (
                  <div
                    key={inc.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isResolved
                        ? 'bg-navy-950/40 border-navy-800 opacity-60'
                        : isCritical
                        ? 'bg-rose-950/20 border-rose-800/60'
                        : 'bg-navy-900 border-navy-750'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isResolved
                              ? 'bg-emerald-400'
                              : isCritical
                              ? 'bg-rose-500 animate-ping'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="text-xs font-bold text-white">{inc.title}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            isResolved
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : isCritical
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-0.5">
                        📍 {inc.locationName} • Radius: {inc.radiusMeters}m
                      </p>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                        {inc.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleGetAiSummary(inc)}
                        disabled={loadingSummaryId === inc.id}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-navy-950 hover:bg-navy-800 text-cyan-300 border border-cyan-800/60 flex items-center space-x-1 transition-all"
                        title="Generate Gemini AI Hazard Impact Assessment"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>{loadingSummaryId === inc.id ? 'Analyzing...' : aiSummaries[inc.id] ? 'Hide AI' : 'AI Analysis'}</span>
                      </button>

                      <button
                        onClick={() => handleToggle(inc.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                          isResolved
                            ? 'bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isResolved ? 'Re-open' : 'Clear & Resolve'}</span>
                      </button>

                      <button
                        onClick={() => handleDelete(inc.id)}
                        className="p-1.5 rounded-lg bg-navy-950 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-navy-800 transition-colors"
                        title="Delete incident"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Expandable AI Hazard Summary Card */}
                    {aiSummaries[inc.id] && (
                      <div className="w-full mt-3 p-3 rounded-lg bg-navy-950/90 border border-cyan-900/50 text-[11px] space-y-2">
                        <div className="flex items-center justify-between text-cyan-300 font-bold font-mono">
                          <span>🤖 {aiSummaries[inc.id].hazardHeadline}</span>
                          <span className="text-[10px] text-slate-400">
                            Provider: {aiSummaries[inc.id].provider === 'GEMINI_AI' ? 'Gemini 1.5 Flash' : 'Tactical Fallback'}
                          </span>
                        </div>
                        <p className="text-slate-300">{aiSummaries[inc.id].impactAssessment}</p>
                        <div className="text-slate-400">
                          <strong className="text-amber-400">Transit Implications:</strong> {aiSummaries[inc.id].transitImplications}
                        </div>
                        <div className="text-slate-400">
                          <strong className="text-emerald-400">Containment:</strong> {aiSummaries[inc.id].containmentRecommendation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
