import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { register, login, getMe } from './controllers/authController';
import { getHospitals, getHospitalById } from './controllers/hospitalController';
import {
  getIncidents,
  createIncident,
  resolveIncident,
  toggleIncidentStatus,
  deleteIncident,
  summarizeIncident
} from './controllers/incidentController';
import {
  calculateRoute,
  saveRoute,
  getRouteHistory,
  explainRouteCustom,
  compareRoutesCustom,
  recommendRecoveryCustom
} from './controllers/routeController';
import { getDashboardStats } from './controllers/statsController';
import { authenticateToken, optionalAuth } from './middleware/auth';
import { getSupabaseStatus } from './services/supabase';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true
  })
);
app.use(express.json());

// Health Check with Database and AI Engine Telemetry
app.get('/api/health', (_req, res) => {
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim() !== '' &&
      !process.env.GEMINI_API_KEY.includes('placeholder')
  );

  res.json({
    status: 'ONLINE',
    service: 'RescueRoute AI API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: getSupabaseStatus(),
    aiEngine: {
      provider: geminiConfigured ? 'GEMINI_1.5_FLASH' : 'TACTICAL_FALLBACK_ENGINE',
      geminiKeyConfigured: geminiConfigured
    }
  });
});

// Auth Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', authenticateToken, getMe);

// Hospitals Routes
app.get('/api/hospitals', getHospitals);
app.get('/api/hospitals/:id', getHospitalById);

// Incident Routes
app.get('/api/incidents', getIncidents);
app.post('/api/incidents', optionalAuth, createIncident);
app.patch('/api/incidents/:id/resolve', resolveIncident);
app.patch('/api/incidents/:id/toggle', toggleIncidentStatus);
app.delete('/api/incidents/:id', deleteIncident);
app.post('/api/incidents/ai-summary', optionalAuth, summarizeIncident);

// Route Optimization & AI Rationale Routes
app.post('/api/routes/calculate', optionalAuth, calculateRoute);
app.post('/api/routes/save', optionalAuth, saveRoute);
app.get('/api/routes/history', optionalAuth, getRouteHistory);
app.post('/api/routes/ai-explain', optionalAuth, explainRouteCustom);
app.post('/api/routes/ai-compare', optionalAuth, compareRoutesCustom);
app.post('/api/routes/ai-recovery', optionalAuth, recommendRecoveryCustom);

// Dashboard Statistics
app.get('/api/stats', getDashboardStats);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚑 RescueRoute AI Backend running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});
