import React, { useState, useEffect, useCallback } from 'react';
import {
  Hospital,
  Incident,
  RouteOption,
  RouteCalculationResult,
  DashboardStats
} from '../types';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { StatsOverview } from '../components/StatsOverview';
import { MapView } from '../components/MapView';
import { RoutePlanner } from '../components/RoutePlanner';
import { RouteComparisonCard } from '../components/RouteComparisonCard';
import { RerouteAlertBanner } from '../components/RerouteAlertBanner';
import { AIExplanationCard } from '../components/AIExplanationCard';
import { IncidentManager } from '../components/IncidentManager';
import { RouteHistoryModal } from '../components/RouteHistoryModal';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [dispatchingRoute, setDispatchingRoute] = useState(false);

  const [routeResult, setRouteResult] = useState<RouteCalculationResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  // Modals
  const [isIncidentsOpen, setIsIncidentsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Fetch initial telemetry
  const loadData = useCallback(async () => {
    try {
      const [hospRes, incRes, statRes] = await Promise.all([
        api.getHospitals(),
        api.getIncidents('ALL'),
        api.getStats()
      ]);

      setHospitals(hospRes.hospitals);
      setIncidents(incRes.incidents);
      setStats(statRes.stats);

      if (hospRes.hospitals.length > 0 && !selectedHospitalId) {
        setSelectedHospitalId(hospRes.hospitals[0].id);
      }

      return { hosp: hospRes.hospitals, inc: incRes.incidents };
    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
      return null;
    }
  }, [selectedHospitalId]);

  // Handle route calculation
  const handleCalculateRoute = async (params: {
    origin: { name: string; coordinates: { lat: number; lng: number } };
    destination: { name: string; coordinates: { lat: number; lng: number } };
    emergencyType: string;
  }) => {
    setCalculatingRoute(true);
    try {
      const res = await api.calculateRoute(params);
      setRouteResult(res);
      setSelectedRouteId(res.recommendedRouteId);

      if (res.hasRoadblockAlert) {
        showToast(
          `ROADBLOCK DETECTED: Automated reroute designated ${res.routes.find((r) => r.id === res.recommendedRouteId)?.name}`,
          'warning'
        );
      } else {
        showToast('Optimal emergency vectors calculated and verified clear of obstructions.');
      }
    } catch (err: any) {
      console.error('Routing calculation error:', err);
      showToast(err.message || 'Routing calculation failed', 'warning');
    } finally {
      setCalculatingRoute(false);
    }
  };

  // Recalculate current route if active (e.g. after roadblock added or resolved)
  const handleRecalculateCurrent = async () => {
    if (!routeResult) return;
    await handleCalculateRoute({
      origin: routeResult.origin,
      destination: routeResult.destination,
      emergencyType: routeResult.emergencyType
    });
  };

  // Initial setup: load telemetry and calculate first baseline scenario
  useEffect(() => {
    const init = async () => {
      setLoadingInitial(true);
      const data = await loadData();
      if (data && data.hosp.length > 0) {
        const firstHospital = data.hosp[0];
        // Calculate default route from Financial District
        await handleCalculateRoute({
          origin: {
            name: 'Downtown Financial District Station 1',
            coordinates: { lat: 37.7946, lng: -122.3999 }
          },
          destination: {
            name: firstHospital.name,
            coordinates: { lat: firstHospital.latitude, lng: firstHospital.longitude }
          },
          emergencyType: 'Code 3 - Critical Trauma'
        });
      }
      setLoadingInitial(false);
    };

    init();
  }, []);

  // When roadblock is created, toggled, or deleted
  const handleIncidentUpdated = async () => {
    const res = await api.getIncidents('ALL');
    setIncidents(res.incidents);
    const statRes = await api.getStats();
    setStats(statRes.stats);

    // Dynamic rerouting automatically triggered!
    if (routeResult) {
      showToast('Roadblock network altered. Recalculating active corridors in real time...', 'info');
      await handleRecalculateCurrent();
    }
  };

  // Resolve an incident directly from map popup
  const handleResolveFromMap = async (incidentId: string) => {
    try {
      await api.resolveIncident(incidentId);
      showToast('Roadblock cleared. Corridor reopened.', 'success');
      await handleIncidentUpdated();
    } catch (err: any) {
      showToast(err.message || 'Failed to clear roadblock', 'warning');
    }
  };

  // Dispatch selected route
  const handleDispatchRoute = async (route: RouteOption) => {
    if (!routeResult) return;
    setDispatchingRoute(true);
    try {
      const avoidedCount = routeResult.routes
        .filter((r) => r.id !== route.id)
        .reduce((sum, r) => sum + r.blockingIncidents.length, 0);

      await api.saveRoute({
        originName: routeResult.origin.name,
        originLat: routeResult.origin.coordinates.lat,
        originLng: routeResult.origin.coordinates.lng,
        destinationName: routeResult.destination.name,
        destLat: routeResult.destination.coordinates.lat,
        destLng: routeResult.destination.coordinates.lng,
        emergencyType: routeResult.emergencyType,
        selectedRouteName: route.name,
        distanceKm: route.distanceKm,
        durationMinutes: route.durationMinutes,
        aiExplanation: routeResult.aiExplanation,
        incidentsAvoided: avoidedCount
      });

      showToast(`Corridor ${route.name} dispatched to ambulance unit. Recorded in telemetry log.`);
      const statRes = await api.getStats();
      setStats(statRes.stats);
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch route', 'warning');
    } finally {
      setDispatchingRoute(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md animate-bounce-short">
          <div
            className={`p-3.5 rounded-xl border shadow-2xl flex items-start space-x-2.5 backdrop-blur-md ${
              toastMessage.type === 'warning'
                ? 'bg-rose-950/90 border-rose-600 text-rose-200'
                : toastMessage.type === 'info'
                ? 'bg-cyan-950/90 border-cyan-600 text-cyan-200'
                : 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
            }`}
          >
            {toastMessage.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            )}
            <p className="text-xs font-medium leading-relaxed">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenIncidents={() => setIsIncidentsOpen(true)}
        activeIncidentsCount={incidents.filter((i) => i.status === 'ACTIVE').length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
        {/* Statistics Bar */}
        <StatsOverview stats={stats} loading={loadingInitial} />

        {/* Dynamic Reroute Alert (shows when roadblock collision occurs) */}
        {routeResult?.rerouteNotice && (
          <RerouteAlertBanner
            rerouteNotice={routeResult.rerouteNotice}
            onFocusRecommended={() => {
              if (routeResult.recommendedRouteId) {
                setSelectedRouteId(routeResult.recommendedRouteId);
              }
            }}
          />
        )}

        {/* Upper Grid: Route Planner Form & Interactive Tactical Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Route Planner */}
          <div className="lg:col-span-5 space-y-4">
            <RoutePlanner
              hospitals={hospitals}
              onCalculate={handleCalculateRoute}
              loading={calculatingRoute}
              selectedHospitalId={selectedHospitalId}
              setSelectedHospitalId={setSelectedHospitalId}
            />

            {/* Quick Roadblock Simulation Action */}
            <div className="p-3.5 rounded-xl bg-navy-900/70 border border-navy-800 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-amber-400 font-mono">
                  Test Dynamic Rerouting
                </span>
                <p className="text-[11px] text-slate-400">
                  Simulate emergency roadblocks & inspect live reroute
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsIncidentsOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Inject Hazard
              </button>
            </div>
          </div>

          {/* Right Column: Tactical Map */}
          <div className="lg:col-span-7">
            <MapView
              origin={routeResult ? routeResult.origin : null}
              destination={routeResult ? routeResult.destination : null}
              routes={routeResult ? routeResult.routes : []}
              selectedRouteId={selectedRouteId}
              onSelectRoute={(id) => setSelectedRouteId(id)}
              incidents={incidents}
              hospitals={hospitals}
              onResolveIncident={handleResolveFromMap}
            />
          </div>
        </div>

        {/* Corridor Evaluation Matrix */}
        {routeResult && (
          <RouteComparisonCard
            routes={routeResult.routes}
            recommendedRouteId={routeResult.recommendedRouteId}
            selectedRouteId={selectedRouteId || routeResult.recommendedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
            onDispatchRoute={handleDispatchRoute}
            dispatching={dispatchingRoute}
          />
        )}

        {/* AI Tactical Dispatch Briefing Card */}
        {routeResult?.aiExplanation && (
          <AIExplanationCard
            explanation={routeResult.aiExplanation}
            loading={calculatingRoute}
            originName={routeResult.origin.name}
            destinationName={routeResult.destination.name}
            emergencyType={routeResult.emergencyType}
            routes={routeResult.routes}
            rerouteNotice={routeResult.rerouteNotice}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-900 bg-navy-950/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RescueRoute AI • Tactical Emergency Dispatch & Rerouting Architecture</span>
          <span className="text-[11px] font-mono text-cyan-400/80">
            Node.js + Prisma SQLite + React TypeScript + CartoDB Leaflet
          </span>
        </div>
      </footer>

      {/* Incident Manager Modal */}
      <IncidentManager
        isOpen={isIncidentsOpen}
        onClose={() => setIsIncidentsOpen(false)}
        incidents={incidents}
        onRefreshIncidents={async () => {
          const res = await api.getIncidents('ALL');
          setIncidents(res.incidents);
        }}
        onIncidentUpdated={handleIncidentUpdated}
      />

      {/* Route History Modal */}
      <RouteHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};
