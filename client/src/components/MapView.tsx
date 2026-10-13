import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RouteOption, Incident, Hospital } from '../types';
import { Layers, ExternalLink } from 'lucide-react';

interface MapViewProps {
  origin: { name: string; coordinates: { lat: number; lng: number } } | null;
  destination: { name: string; coordinates: { lat: number; lng: number } } | null;
  routes: RouteOption[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  incidents: Incident[];
  hospitals: Hospital[];
  onResolveIncident?: (id: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  origin,
  destination,
  routes,
  selectedRouteId,
  onSelectRoute,
  incidents,
  hospitals,
  onResolveIncident
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.FeatureGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Default center on San Francisco metro
    const defaultCenter: [number, number] = [37.7749, -122.4194];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Dark CartoDB Matter Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Zoom controls at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const featureGroup = L.featureGroup().addTo(map);
    layersGroupRef.current = featureGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Map Layers whenever routes, incidents, origin or destination change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Render Active & Resolved Roadblock Incidents
    incidents.forEach((inc) => {
      const isCritical = inc.severity === 'CRITICAL';
      const isResolved = inc.status === 'RESOLVED';

      // Danger Radius Circle
      if (!isResolved) {
        const circle = L.circle([inc.latitude, inc.longitude], {
          radius: inc.radiusMeters || 200,
          color: isCritical ? '#EF4444' : '#F59E0B',
          fillColor: isCritical ? '#EF4444' : '#F59E0B',
          fillOpacity: 0.18,
          weight: 1.5,
          dashArray: '4, 4'
        });
        group.addLayer(circle);
      }

      // Incident Marker Icon
      const iconHtml = `
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: ${isResolved ? '#059669' : isCritical ? '#DC2626' : '#D97706'};
          border: 2px solid ${isResolved ? '#34D399' : '#FCA5A5'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 0 15px ${isResolved ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.7)'};
        ">
          ${isResolved ? '✓' : '⚠️'}
        </div>
      `;

      const incidentIcon = L.divIcon({
        html: iconHtml,
        className: 'incident-marker-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: incidentIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-100 text-xs font-sans';
      popupContent.innerHTML = `
        <div style="font-weight: 700; color: ${isResolved ? '#34D399' : '#F87171'}; font-size: 13px; margin-bottom: 4px;">
          ${inc.title}
        </div>
        <div style="color: #94A3B8; margin-bottom: 4px;">📍 ${inc.locationName}</div>
        <div style="display: flex; gap: 6px; margin-bottom: 6px;">
          <span style="background: rgba(30, 58, 95, 0.8); padding: 2px 6px; border-radius: 4px; font-size: 10px; color: #38BDF8;">
            ${inc.severity}
          </span>
          <span style="background: ${isResolved ? 'rgba(5, 150, 105, 0.4)' : 'rgba(220, 38, 38, 0.4)'}; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
            ${inc.status}
          </span>
        </div>
        <div style="color: #CBD5E1; font-size: 11px; margin-bottom: 8px;">${inc.description}</div>
      `;

      if (!isResolved && onResolveIncident) {
        const resolveBtn = document.createElement('button');
        resolveBtn.innerText = 'Resolve & Clear Roadblock';
        resolveBtn.style.cssText =
          'background: #10B981; color: black; font-weight: 600; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; border: none; width: 100%;';
        resolveBtn.onclick = () => {
          onResolveIncident(inc.id);
          marker.closePopup();
        };
        popupContent.appendChild(resolveBtn);
      }

      marker.bindPopup(popupContent);
      group.addLayer(marker);
    });

    // 2. Render Hospital Markers
    hospitals.forEach((hosp) => {
      const isSelectedDest = destination && hosp.name === destination.name;
      const hospHtml = `
        <div style="
          width: ${isSelectedDest ? '36px' : '28px'};
          height: ${isSelectedDest ? '36px' : '28px'};
          border-radius: 50%;
          background: #0284C7;
          border: 2px solid ${isSelectedDest ? '#00F0FF' : '#7DD3FC'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: ${isSelectedDest ? '16px' : '13px'};
          box-shadow: 0 0 ${isSelectedDest ? '20px rgba(0,240,255,0.8)' : '10px rgba(2,132,199,0.5)'};
        ">
          🏥
        </div>
      `;

      const hospIcon = L.divIcon({
        html: hospHtml,
        className: 'hosp-marker-icon',
        iconSize: isSelectedDest ? [36, 36] : [28, 28],
        iconAnchor: isSelectedDest ? [18, 18] : [14, 14]
      });

      const marker = L.marker([hosp.latitude, hosp.longitude], { icon: hospIcon });
      marker.bindPopup(`
        <div style="padding: 2px; color: #F1F5F9; font-size: 12px;">
          <div style="font-weight: bold; color: #38BDF8; font-size: 13px;">${hosp.name}</div>
          <div style="color: #94A3B8; font-size: 11px;">📍 ${hosp.address}</div>
          <div style="margin-top: 4px; font-size: 11px;">
            <span style="color: #10B981; font-weight: 600;">Trauma Rating: ${hosp.traumaLevel}</span>
          </div>
          <div style="color: #CBD5E1; font-size: 10px; margin-top: 2px;">
            Beds Available: <b style="color: #F8FAFC;">${hosp.availableBeds}</b> | ${hosp.specialty}
          </div>
        </div>
      `);
      group.addLayer(marker);
    });

    // 3. Render Origin Marker (Ambulance)
    if (origin) {
      const originHtml = `
        <div class="pulse-marker-origin" style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0E7490;
          border: 2px solid #00F0FF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 0 15px rgba(0,240,255,0.8);
        ">
          <div class="pulse-ring"></div>
          🚑
        </div>
      `;

      const originIcon = L.divIcon({
        html: originHtml,
        className: 'origin-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const originMarker = L.marker([origin.coordinates.lat, origin.coordinates.lng], {
        icon: originIcon,
        zIndexOffset: 1000
      });

      originMarker.bindPopup(`
        <div style="color: #F8FAFC; font-size: 12px;">
          <b style="color: #00F0FF;">Emergency Origin Location</b>
          <div>${origin.name}</div>
        </div>
      `);
      group.addLayer(originMarker);
    }

    // 4. Render Calculated Route Polylines
    if (routes.length > 0) {
      routes.forEach((route) => {
        const isSelected = route.id === selectedRouteId;
        const isBlocked = route.blocked;

        let strokeColor = '#38BDF8';
        let weight = 4;
        let opacity = 0.65;
        let dashArray = undefined;

        if (isBlocked) {
          strokeColor = '#EF4444';
          weight = isSelected ? 6 : 4;
          dashArray = '6, 8';
          opacity = 0.85;
        } else if (isSelected) {
          strokeColor = '#00F0FF';
          weight = 6;
          opacity = 0.95;
        } else {
          strokeColor = '#64748B';
          weight = 3.5;
          opacity = 0.45;
        }

        const polyline = L.polyline(route.waypoints, {
          color: strokeColor,
          weight,
          opacity,
          dashArray,
          lineJoin: 'round',
          lineCap: 'round'
        });

        polyline.on('click', () => {
          onSelectRoute(route.id);
        });

        polyline.bindPopup(`
          <div style="color: #F8FAFC; font-size: 12px;">
            <div style="font-weight: bold; color: ${isBlocked ? '#EF4444' : '#00F0FF'};">
              ${route.name}
            </div>
            <div>ETA: <b>${route.durationMinutes} mins</b> (${route.distanceKm} km)</div>
            <div>Status: ${isBlocked ? '⚠️ BLOCKED BY ROADBLOCK' : '✅ Clear Corridor'}</div>
            <div>Score: <b>${route.score}/100</b></div>
          </div>
        `);

        group.addLayer(polyline);
      });
    }

    // Fit map bounds to view all active points and routes
    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 15,
        animate: true
      });
    }
  }, [origin, destination, routes, selectedRouteId, incidents, hospitals, onResolveIncident, onSelectRoute]);

  // Google Maps external direction URL fallback
  const getGoogleMapsDirectionsUrl = () => {
    if (!origin || !destination) return '#';
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.coordinates.lat},${origin.coordinates.lng}&destination=${destination.coordinates.lat},${destination.coordinates.lng}&travelmode=driving`;
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[440px] lg:h-[480px] rounded-2xl overflow-hidden border border-navy-750 shadow-xl bg-navy-950">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 z-10 glass-panel rounded-xl px-3 py-2 border border-navy-700/80 shadow-lg text-[11px] text-slate-200 pointer-events-auto flex flex-col gap-1.5 backdrop-blur-md">
        <div className="font-semibold text-white flex items-center space-x-1.5 text-xs pb-1 border-b border-navy-700/60 font-mono">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>TACTICAL OVERLAY</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-500/30"></span>
          <span>Recommended Corridor</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
          <span>Alternative Corridors</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Simulated Roadblock (Blocked)</span>
        </div>
      </div>

      {/* External Map Utility Tools */}
      <div className="absolute top-3 right-3 z-10 flex space-x-2">
        {origin && destination && (
          <a
            href={getGoogleMapsDirectionsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-navy-900/90 hover:bg-navy-800 text-cyan-300 border border-cyan-800/60 text-xs font-medium shadow-md backdrop-blur-md transition-all"
            title="Open directions in Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google Maps View</span>
          </a>
        )}
      </div>

      {/* Interactive status banner inside map footer */}
      {routes.length > 0 && selectedRouteId && (
        <div className="absolute bottom-3 left-3 right-16 sm:right-auto z-10 glass-panel rounded-lg px-3 py-1.5 border border-navy-700/80 shadow-md text-xs font-mono text-slate-300 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-white font-medium">
            Active Focus: {routes.find((r) => r.id === selectedRouteId)?.name}
          </span>
          <span className="text-slate-400">
            • {routes.find((r) => r.id === selectedRouteId)?.durationMinutes}m ETA
          </span>
        </div>
      )}
    </div>
  );
};
