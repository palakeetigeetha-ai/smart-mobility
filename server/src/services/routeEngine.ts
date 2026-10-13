export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ActiveIncident {
  id: string;
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  severity: string; // CRITICAL, MAJOR, MODERATE, MINOR
  category: string;
  radiusMeters: number;
  status: string;
}

export interface RouteOption {
  id: string;
  name: string;
  tagline: string;
  type: 'PRIORITY_CORRIDOR' | 'EXPRESSWAY' | 'ARTERIAL_BYPASS';
  distanceKm: number;
  durationMinutes: number;
  baseDurationMinutes: number;
  delayMinutes: number;
  blocked: boolean;
  score: number; // 0 - 100 Suitability Index
  blockingIncidents: Array<{
    id: string;
    title: string;
    severity: string;
    locationName: string;
    distanceMeters: number;
  }>;
  signalPreemption: boolean;
  trafficLevel: 'LOW' | 'MODERATE' | 'HEAVY' | 'BLOCKED';
  waypoints: [number, number][]; // [lat, lng]
  summaryHighlights: string[];
}

export interface RouteCalculationResult {
  origin: { name: string; coordinates: Coordinates };
  destination: { name: string; coordinates: Coordinates };
  emergencyType: string;
  routes: RouteOption[];
  recommendedRouteId: string;
  hasRoadblockAlert: boolean;
  rerouteNotice?: {
    originalBlockedRoute: string;
    incidentCausingDetour: string;
    recommendedAlternative: string;
    timeSavedMinutes: number;
  };
  totalIncidentsChecked: number;
  activeIncidentsInCorridor: number;
}

// Haversine formula to compute distance in meters between two lat/lng points
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Distance from point (pLat, pLng) to line segment (aLat, aLng) -> (bLat, bLng) in meters
export function distanceToSegmentMeters(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const dAB = calculateDistanceMeters(aLat, aLng, bLat, bLng);
  if (dAB === 0) return calculateDistanceMeters(pLat, pLng, aLat, aLng);

  // Projection ratio on segment
  const t = Math.max(
    0,
    Math.min(
      1,
      ((pLat - aLat) * (bLat - aLat) + (pLng - aLng) * (bLng - aLng)) /
        ((bLat - aLat) * (bLat - aLat) + (pLng - aLng) * (bLng - aLng))
    )
  );

  const projLat = aLat + t * (bLat - aLat);
  const projLng = aLng + t * (bLng - aLng);
  return calculateDistanceMeters(pLat, pLng, projLat, projLng);
}

// Generate realistic polyline waypoints with varied geographic curvatures
function generateWaypoints(
  origin: Coordinates,
  destination: Coordinates,
  curvatureOffset: { lat: number; lng: number },
  numIntermediatePoints: number = 6
): [number, number][] {
  const points: [number, number][] = [];
  points.push([origin.lat, origin.lng]);

  for (let i = 1; i <= numIntermediatePoints; i++) {
    const fraction = i / (numIntermediatePoints + 1);
    // Smooth bell curve factor for displacement
    const bellFactor = Math.sin(fraction * Math.PI);

    const lat =
      origin.lat +
      (destination.lat - origin.lat) * fraction +
      curvatureOffset.lat * bellFactor;
    const lng =
      origin.lng +
      (destination.lng - origin.lng) * fraction +
      curvatureOffset.lng * bellFactor;

    points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }

  points.push([destination.lat, destination.lng]);
  return points;
}

export function computeRoutes(
  origin: { name: string; coordinates: Coordinates },
  destination: { name: string; coordinates: Coordinates },
  emergencyType: string,
  activeIncidents: ActiveIncident[]
): RouteCalculationResult {
  const directDistanceMeters = calculateDistanceMeters(
    origin.coordinates.lat,
    origin.coordinates.lng,
    destination.coordinates.lat,
    destination.coordinates.lng
  );
  const directDistanceKm = directDistanceMeters / 1000;

  // Vector perpendicular for curving routes
  const dLat = destination.coordinates.lat - origin.coordinates.lat;
  const dLng = destination.coordinates.lng - origin.coordinates.lng;
  const perpLat = -dLng * 0.45;
  const perpLng = dLat * 0.45;

  // Define 3 realistic tactical route options:
  // Route Alpha: Direct Medical Corridor
  const alphaWaypoints = generateWaypoints(
    origin.coordinates,
    destination.coordinates,
    { lat: perpLat * 0.1, lng: perpLng * 0.1 },
    8
  );
  const alphaDistKm = Math.round((directDistanceKm * 1.08 + 0.3) * 10) / 10;
  const alphaBaseMin = Math.round((alphaDistKm / 46) * 60 * 10) / 10; // ~46 km/h avg speed

  // Route Bravo: Expressway Outer Loop
  const bravoWaypoints = generateWaypoints(
    origin.coordinates,
    destination.coordinates,
    { lat: perpLat * 1.25, lng: perpLng * 1.25 },
    10
  );
  const bravoDistKm = Math.round((directDistanceKm * 1.28 + 0.8) * 10) / 10;
  const bravoBaseMin = Math.round((bravoDistKm / 68) * 60 * 10) / 10; // ~68 km/h on expressway

  // Route Charlie: Arterial Boulevard / Parallel Grid
  const charlieWaypoints = generateWaypoints(
    origin.coordinates,
    destination.coordinates,
    { lat: -perpLat * 0.95, lng: -perpLng * 0.95 },
    9
  );
  const charlieDistKm = Math.round((directDistanceKm * 1.18 + 0.5) * 10) / 10;
  const charlieBaseMin = Math.round((charlieDistKm / 42) * 60 * 10) / 10; // ~42 km/h on grid

  const rawRouteDefinitions: Array<{
    id: string;
    name: string;
    tagline: string;
    type: 'PRIORITY_CORRIDOR' | 'EXPRESSWAY' | 'ARTERIAL_BYPASS';
    distanceKm: number;
    baseDurationMinutes: number;
    signalPreemption: boolean;
    waypoints: [number, number][];
    highlights: string[];
  }> = [
    {
      id: 'route-alpha',
      name: 'Corridor Alpha (Medical Priority)',
      tagline: 'Direct urban artery with emergency signal preemption',
      type: 'PRIORITY_CORRIDOR',
      distanceKm: alphaDistKm,
      baseDurationMinutes: alphaBaseMin,
      signalPreemption: true,
      waypoints: alphaWaypoints,
      highlights: [
        'Green wave traffic light preemption enabled',
        'Direct multi-lane medical priority corridor',
        'Minimal turns for patient hemodynamic stability'
      ]
    },
    {
      id: 'route-bravo',
      name: 'Route Bravo (Metro Expressway)',
      tagline: 'High-speed controlled access highway bypass',
      type: 'EXPRESSWAY',
      distanceKm: bravoDistKm,
      baseDurationMinutes: bravoBaseMin,
      signalPreemption: false,
      waypoints: bravoWaypoints,
      highlights: [
        'Full grade-separated highway with emergency shoulder',
        'No traffic lights or pedestrian crossings',
        'Higher sustained velocity (68-80 km/h)'
      ]
    },
    {
      id: 'route-charlie',
      name: 'Route Charlie (Arterial Bypass)',
      tagline: 'Parallel grid corridor avoiding central congestion',
      type: 'ARTERIAL_BYPASS',
      distanceKm: charlieDistKm,
      baseDurationMinutes: charlieBaseMin,
      signalPreemption: false,
      waypoints: charlieWaypoints,
      highlights: [
        'Circumvents core downtown bottleneck corridors',
        'Multiple fallback cross-street escape points',
        'Smooth asphalt conditions reported'
      ]
    }
  ];

  const processedRoutes: RouteOption[] = rawRouteDefinitions.map((def) => {
    // Check collisions with active incidents
    const blockingIncidents: RouteOption['blockingIncidents'] = [];
    let extraDelay = 0;
    let isBlocked = false;

    for (const incident of activeIncidents) {
      if (incident.status !== 'ACTIVE') continue;

      let minDistanceToRoute = Infinity;
      for (let i = 0; i < def.waypoints.length - 1; i++) {
        const segDist = distanceToSegmentMeters(
          incident.latitude,
          incident.longitude,
          def.waypoints[i][0],
          def.waypoints[i][1],
          def.waypoints[i + 1][0],
          def.waypoints[i + 1][1]
        );
        if (segDist < minDistanceToRoute) {
          minDistanceToRoute = segDist;
        }
      }

      // If within incident radius + 150m buffer
      const threshold = incident.radiusMeters + 150;
      if (minDistanceToRoute <= threshold) {
        let incidentPenalty = 0;
        if (incident.severity === 'CRITICAL') {
          incidentPenalty = 22; // Impassable complete roadblock
          isBlocked = true;
        } else if (incident.severity === 'MAJOR') {
          incidentPenalty = 14;
          isBlocked = true;
        } else if (incident.severity === 'MODERATE') {
          incidentPenalty = 6;
        } else {
          incidentPenalty = 2.5;
        }

        extraDelay += incidentPenalty;
        blockingIncidents.push({
          id: incident.id,
          title: incident.title,
          severity: incident.severity,
          locationName: incident.locationName,
          distanceMeters: Math.round(minDistanceToRoute)
        });
      }
    }

    // Determine traffic level
    let trafficLevel: RouteOption['trafficLevel'] = 'LOW';
    if (isBlocked) {
      trafficLevel = 'BLOCKED';
    } else if (extraDelay > 8) {
      trafficLevel = 'HEAVY';
    } else if (extraDelay > 2) {
      trafficLevel = 'MODERATE';
    }

    const totalDuration = Math.round((def.baseDurationMinutes + extraDelay) * 10) / 10;

    // Calculate Suitability Score (0-100)
    // Faster ETA gives higher base score
    // Blocked route severely penalized
    let score = Math.max(10, Math.min(99, 100 - totalDuration * 3.2));
    if (def.signalPreemption) score += 6; // Preemption bonus
    if (def.type === 'EXPRESSWAY') score += 3; // Expressway stability bonus

    if (isBlocked) {
      // Heavily penalize blocked routes
      score = Math.max(8, Math.min(28, score - 55));
    }

    const highlights = [...def.highlights];
    if (isBlocked) {
      highlights.unshift(`CRITICAL HAZARD: Route blocked by ${blockingIncidents[0].title}`);
    } else if (extraDelay > 0) {
      highlights.push(`Minor incident nearby adds approx +${extraDelay.toFixed(0)}m slowdown`);
    } else {
      highlights.push('Zero active incident interference on this corridor');
    }

    return {
      id: def.id,
      name: def.name,
      tagline: def.tagline,
      type: def.type,
      distanceKm: def.distanceKm,
      durationMinutes: totalDuration,
      baseDurationMinutes: def.baseDurationMinutes,
      delayMinutes: Math.round(extraDelay * 10) / 10,
      blocked: isBlocked,
      score: Math.round(score),
      blockingIncidents,
      signalPreemption: def.signalPreemption,
      trafficLevel,
      waypoints: def.waypoints,
      summaryHighlights: highlights
    };
  });

  // Pick recommended route:
  // Sort primarily by unblocked first, then by score / duration
  const sorted = [...processedRoutes].sort((a, b) => {
    if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
    return b.score - a.score;
  });

  const recommended = sorted[0];

  // Check if primary route (Route Alpha) was blocked and triggered a reroute
  const alphaRoute = processedRoutes.find((r) => r.id === 'route-alpha');
  const hasRoadblockAlert = Boolean(alphaRoute?.blocked);

  let rerouteNotice: RouteCalculationResult['rerouteNotice'] = undefined;
  if (hasRoadblockAlert && alphaRoute && recommended.id !== 'route-alpha') {
    const timeSaved = Math.max(
      1.5,
      Math.round((alphaRoute.durationMinutes - recommended.durationMinutes) * 10) / 10
    );
    rerouteNotice = {
      originalBlockedRoute: alphaRoute.name,
      incidentCausingDetour:
        alphaRoute.blockingIncidents[0]?.title || 'Critical Roadblock Detected',
      recommendedAlternative: recommended.name,
      timeSavedMinutes: timeSaved
    };
  }

  const corridorIncidents = activeIncidents.filter((inc) => inc.status === 'ACTIVE').length;

  return {
    origin,
    destination,
    emergencyType,
    routes: processedRoutes,
    recommendedRouteId: recommended.id,
    hasRoadblockAlert,
    rerouteNotice,
    totalIncidentsChecked: activeIncidents.length,
    activeIncidentsInCorridor: corridorIncidents
  };
}
