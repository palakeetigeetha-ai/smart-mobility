import React, { useState, useEffect } from 'react';
import { Hospital } from '../types';
import { Navigation, Sparkles, RefreshCw } from 'lucide-react';

interface RoutePlannerProps {
  hospitals: Hospital[];
  onCalculate: (params: {
    origin: { name: string; coordinates: { lat: number; lng: number } };
    destination: { name: string; coordinates: { lat: number; lng: number } };
    emergencyType: string;
  }) => void;
  loading: boolean;
  selectedHospitalId: string | null;
  setSelectedHospitalId: (id: string) => void;
}

const PRESET_ORIGINS = [
  {
    name: 'Downtown Financial District Station 1',
    coordinates: { lat: 37.7946, lng: -122.3999 },
    desc: 'High-density commercial core'
  },
  {
    name: 'Market St & Civic Plaza Post',
    coordinates: { lat: 37.781, lng: -122.411 },
    desc: 'Central transit intersection'
  },
  {
    name: 'Mission District Medic Substation 7',
    coordinates: { lat: 37.761, lng: -122.419 },
    desc: 'Dense arterial residential grid'
  },
  {
    name: 'Sunset West Emergency Staging Zone',
    coordinates: { lat: 37.754, lng: -122.482 },
    desc: 'Perimeter highway access'
  }
];

const EMERGENCY_TYPES = [
  {
    code: 'Code 3 - Critical Trauma',
    label: 'Code 3 (Critical - Maximum Sirens & Speed)',
    color: 'text-rose-400 border-rose-500/40 bg-rose-950/30'
  },
  {
    code: 'Code 2 - Urgent Cardiac/Stroke',
    label: 'Code 2 (Urgent - Expedited Arterial Priority)',
    color: 'text-amber-400 border-amber-500/40 bg-amber-950/30'
  },
  {
    code: 'Code 1 - Standard Transfer',
    label: 'Code 1 (Standard Non-Emergency Care)',
    color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30'
  }
];

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  hospitals,
  onCalculate,
  loading,
  selectedHospitalId,
  setSelectedHospitalId
}) => {
  const [selectedOriginIndex, setSelectedOriginIndex] = useState(0);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState(
    'Code 3 - Critical Trauma'
  );
  const [useCustomOrigin, setUseCustomOrigin] = useState(false);
  const [customOriginName, setCustomOriginName] = useState('');
  const [customLat, setCustomLat] = useState('37.7749');
  const [customLng, setCustomLng] = useState('-122.4194');

  // Default to first hospital if none selected
  useEffect(() => {
    if (!selectedHospitalId && hospitals.length > 0) {
      setSelectedHospitalId(hospitals[0].id);
    }
  }, [hospitals, selectedHospitalId, setSelectedHospitalId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];
    if (!hospital) return;

    let origin: { name: string; coordinates: { lat: number; lng: number } };

    if (useCustomOrigin) {
      origin = {
        name: customOriginName || 'Custom Emergency Coordinates',
        coordinates: {
          lat: parseFloat(customLat) || 37.7749,
          lng: parseFloat(customLng) || -122.4194
        }
      };
    } else {
      origin = PRESET_ORIGINS[selectedOriginIndex];
    }

    const destination = {
      name: hospital.name,
      coordinates: {
        lat: hospital.latitude,
        lng: hospital.longitude
      }
    };

    onCalculate({
      origin,
      destination,
      emergencyType: selectedEmergencyType
    });
  };

  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);

  return (
    <div className="rounded-2xl bg-navy-900/90 border border-navy-750 p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-navy-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Emergency Dispatch Planner
            </h2>
            <p className="text-[11px] text-slate-400">
              Live routing engine with dynamic roadblock avoidance
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setUseCustomOrigin(!useCustomOrigin)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          {useCustomOrigin ? 'Use Preset Hotspots' : 'Custom Coords'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Origin Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Origin (Emergency Dispatch Staging)
          </label>
          {useCustomOrigin ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Staging location name (e.g. 5th & Harrison)"
                value={customOriginName}
                onChange={(e) => setCustomOriginName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-navy-950 border border-navy-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Latitude (e.g. 37.7749)"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Longitude (e.g. -122.4194)"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          ) : (
            <select
              value={selectedOriginIndex}
              onChange={(e) => setSelectedOriginIndex(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2.5 rounded-lg bg-navy-950 border border-navy-700 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {PRESET_ORIGINS.map((item, idx) => (
                <option key={idx} value={idx}>
                  📍 {item.name} ({item.desc})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Destination Hospital Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Destination Trauma Facility
          </label>
          <select
            value={selectedHospitalId || ''}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-navy-950 border border-navy-700 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {hospitals.map((hosp) => (
              <option key={hosp.id} value={hosp.id}>
                🏥 {hosp.name} • {hosp.traumaLevel} ({hosp.availableBeds} beds available)
              </option>
            ))}
          </select>

          {/* Hospital Preview Badge */}
          {selectedHospital && (
            <div className="mt-2 p-2.5 rounded-lg bg-navy-950/70 border border-navy-800 text-[11px] text-slate-300 flex items-center justify-between">
              <div>
                <span className="font-semibold text-cyan-400">
                  {selectedHospital.traumaLevel}
                </span>{' '}
                • {selectedHospital.specialty}
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                {selectedHospital.availableBeds} Beds Open
              </span>
            </div>
          )}
        </div>

        {/* Emergency Code Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Emergency Priority Level
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {EMERGENCY_TYPES.map((et) => {
              const isSelected = selectedEmergencyType === et.code;
              return (
                <button
                  type="button"
                  key={et.code}
                  onClick={() => setSelectedEmergencyType(et.code)}
                  className={`px-2.5 py-2 rounded-lg text-left text-xs border transition-all ${
                    isSelected
                      ? `${et.color} ring-1 ring-cyan-400 font-semibold`
                      : 'bg-navy-950/60 border-navy-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="truncate">{et.code.split(' - ')[0]}</div>
                  <div className="text-[10px] opacity-75 truncate">{et.code.split(' - ')[1]}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Optimization Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Analyzing Vector Obstructions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Compute Optimal Emergency Routes</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
