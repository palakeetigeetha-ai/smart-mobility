import {
  User,
  Hospital,
  Incident,
  RouteCalculationResult,
  RouteHistoryItem,
  DashboardStats
} from '../types';

const envApiUrl = import.meta.env.VITE_API_URL;
const API_BASE = envApiUrl ? `${envApiUrl.replace(/\/$/, '')}/api` : '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('rescueroute_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Hospitals
  async getHospitals(): Promise<{ hospitals: Hospital[] }> {
    const res = await fetch(`${API_BASE}/hospitals`);
    return handleResponse(res);
  },

  // Incidents
  async getIncidents(status?: 'ACTIVE' | 'RESOLVED' | 'ALL'): Promise<{ incidents: Incident[] }> {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/incidents${query}`);
    return handleResponse(res);
  },

  async createIncident(incidentData: {
    title: string;
    description: string;
    locationName: string;
    latitude: number;
    longitude: number;
    severity: string;
    category: string;
    radiusMeters: number;
  }): Promise<{ incident: Incident; message: string }> {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(incidentData)
    });
    return handleResponse(res);
  },

  async resolveIncident(id: string): Promise<{ incident: Incident; message: string }> {
    const res = await fetch(`${API_BASE}/incidents/${id}/resolve`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async toggleIncident(id: string): Promise<{ incident: Incident; message: string }> {
    const res = await fetch(`${API_BASE}/incidents/${id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async deleteIncident(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/incidents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Routes
  async calculateRoute(params: {
    origin: { name: string; coordinates: { lat: number; lng: number } };
    destination: { name: string; coordinates: { lat: number; lng: number } };
    emergencyType: string;
  }): Promise<RouteCalculationResult> {
    const res = await fetch(`${API_BASE}/routes/calculate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  async saveRoute(params: {
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
    aiExplanation: any;
    incidentsAvoided: number;
  }): Promise<{ route: RouteHistoryItem; message: string }> {
    const res = await fetch(`${API_BASE}/routes/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  async getRouteHistory(): Promise<{ history: RouteHistoryItem[] }> {
    const res = await fetch(`${API_BASE}/routes/history`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Stats
  async getStats(): Promise<{
    stats: DashboardStats;
    recentIncidents: Incident[];
    recentRoutes: RouteHistoryItem[];
  }> {
    const res = await fetch(`${API_BASE}/stats`);
    return handleResponse(res);
  },

  // Extended AI Features (Gemini with Fallback)
  async compareRoutes(params: {
    originName: string;
    destinationName: string;
    emergencyType: string;
    routes: any[];
  }): Promise<{ comparison: import('../types').RouteComparisonData }> {
    const res = await fetch(`${API_BASE}/routes/ai-compare`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  async getRecoveryRecommendations(params: {
    incidentTitle: string;
    locationName: string;
    severity: string;
    clearedOrActive: 'ACTIVE' | 'CLEARED';
    blockedCorridors: string[];
    availableAlternatives: string[];
  }): Promise<{ recovery: import('../types').RecoveryRecommendationData }> {
    const res = await fetch(`${API_BASE}/routes/ai-recovery`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  async summarizeIncident(incident: {
    title: string;
    locationName: string;
    severity?: string;
    category?: string;
    radiusMeters?: number;
    description?: string;
  }): Promise<{ summary: import('../types').IncidentSummaryData }> {
    const res = await fetch(`${API_BASE}/incidents/ai-summary`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(incident)
    });
    return handleResponse(res);
  },

  // Health and System Diagnostics
  async getHealth(): Promise<import('../types').SystemHealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  }
};
