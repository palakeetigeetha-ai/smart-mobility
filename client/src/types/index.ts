export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  createdAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  traumaLevel: string;
  availableBeds: number;
  specialty: string;
  contactPhone: string;
  status: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'MINOR';
  category: string;
  status: 'ACTIVE' | 'RESOLVED';
  radiusMeters: number;
  reportedBy: string;
  clearedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlockingIncidentInfo {
  id: string;
  title: string;
  severity: string;
  locationName: string;
  distanceMeters: number;
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
  score: number;
  blockingIncidents: BlockingIncidentInfo[];
  signalPreemption: boolean;
  trafficLevel: 'LOW' | 'MODERATE' | 'HEAVY' | 'BLOCKED';
  waypoints: [number, number][];
  summaryHighlights: string[];
}

export interface AIExplanation {
  summary: string;
  rationale: string[];
  crewGuidance: string;
  hazardsMitigated: string[];
  provider: 'GEMINI_AI' | 'TACTICAL_FALLBACK';
  timestamp: string;
}

export interface RouteCalculationResult {
  origin: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
  destination: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
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
  aiExplanation: AIExplanation;
}

export interface RouteHistoryItem {
  id: string;
  userId?: string;
  originName: string;
  originLat: number;
  originLng: number;
  destinationName: string;
  destLat: number;
  destLng: number;
  emergencyType: string;
  selectedRouteName: string;
  distanceKm: number;
  durationMinutes: number;
  aiExplanation: string;
  incidentsAvoided: number;
  createdAt: string;
  user?: {
    name: string;
    role: string;
  };
}

export interface DashboardStats {
  activeIncidents: number;
  resolvedIncidents: number;
  criticalAlerts: number;
  totalRoutesDispatched: number;
  monitoredHospitals: number;
  avgResponseTimeSavedMinutes: number;
  networkEfficiencyScore: number;
}

export interface RouteComparisonData {
  overview: string;
  recommendedCorridor: string;
  comparisons: Array<{
    routeName: string;
    strategicVerdict: string;
    patientRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    trafficVolatility: string;
    keyAdvantage: string;
    keyDrawback: string;
  }>;
  tacticalTradeoffs: string[];
  provider: 'GEMINI_AI' | 'TACTICAL_FALLBACK';
}

export interface IncidentSummaryData {
  hazardHeadline: string;
  impactAssessment: string;
  criticalRisks: string[];
  transitImplications: string;
  containmentRecommendation: string;
  provider: 'GEMINI_AI' | 'TACTICAL_FALLBACK';
}

export interface RecoveryRecommendationData {
  operationalStatus: string;
  actionItems: string[];
  trafficSignalPreemptionGuidance: string;
  traumaCenterPreparationNotice: string;
  corridorReopeningProtocol: string;
  provider: 'GEMINI_AI' | 'TACTICAL_FALLBACK';
}

export interface SystemHealthStatus {
  status: string;
  service: string;
  uptime: number;
  timestamp: string;
  database: {
    projectUrl: string;
    configured: boolean;
    databaseMode: string;
    hasAnonKey: boolean;
    hasServiceKey: boolean;
  };
  aiEngine: {
    provider: string;
    geminiKeyConfigured: boolean;
  };
}
