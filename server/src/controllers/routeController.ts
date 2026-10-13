import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth';
import { computeRoutes } from '../services/routeEngine';
import { generateRouteExplanation } from '../services/geminiService';

export const calculateRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { origin, destination, emergencyType } = req.body;

    if (!origin || !destination) {
      res.status(400).json({ error: 'Origin and destination details are required.' });
      return;
    }

    if (!origin.coordinates || !destination.coordinates) {
      res.status(400).json({
        error: 'Both origin and destination must include lat/lng coordinates.'
      });
      return;
    }

    // Fetch active incidents from database
    const activeIncidents = await prisma.incident.findMany({
      where: { status: 'ACTIVE' }
    });

    // Run route scoring & incident collision detection
    const routeResult = computeRoutes(
      origin,
      destination,
      emergencyType || 'Code 3 - Critical Trauma',
      activeIncidents
    );

    // Find recommended route object
    const recommendedRoute = routeResult.routes.find(
      (r) => r.id === routeResult.recommendedRouteId
    ) || routeResult.routes[0];

    const alternativeRoutes = routeResult.routes.filter(
      (r) => r.id !== recommendedRoute.id
    );

    // Count how many incidents were avoided
    const avoidedCount = alternativeRoutes.reduce(
      (acc, r) => acc + r.blockingIncidents.length,
      0
    );

    // Generate AI explanation (Gemini or tactical fallback)
    const aiExplanation = await generateRouteExplanation({
      originName: origin.name,
      destinationName: destination.name,
      emergencyType: emergencyType || 'Code 3 - Critical Trauma',
      selectedRoute: recommendedRoute,
      alternativeRoutes,
      avoidedIncidentsCount: avoidedCount,
      rerouteOccurred: routeResult.hasRoadblockAlert,
      rerouteDetails: routeResult.rerouteNotice
    });

    res.json({
      ...routeResult,
      aiExplanation
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    res.status(500).json({ error: 'Failed to calculate emergency route.' });
  }
};

export const saveRoute = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      originName,
      originLat,
      originLng,
      destinationName,
      destLat,
      destLng,
      emergencyType,
      selectedRouteName,
      distanceKm,
      durationMinutes,
      aiExplanation,
      incidentsAvoided
    } = req.body;

    if (!originName || !destinationName || !selectedRouteName) {
      res.status(400).json({ error: 'Missing required route history fields.' });
      return;
    }

    const saved = await prisma.routeHistory.create({
      data: {
        userId: req.user?.id || null,
        originName,
        originLat: parseFloat(originLat),
        originLng: parseFloat(originLng),
        destinationName,
        destLat: parseFloat(destLat),
        destLng: parseFloat(destLng),
        emergencyType: emergencyType || 'Code 3 - Critical Trauma',
        selectedRouteName,
        distanceKm: parseFloat(distanceKm),
        durationMinutes: parseFloat(durationMinutes),
        aiExplanation:
          typeof aiExplanation === 'string'
            ? aiExplanation
            : JSON.stringify(aiExplanation),
        incidentsAvoided: incidentsAvoided ? parseInt(incidentsAvoided, 10) : 0
      }
    });

    res.status(201).json({
      message: 'Emergency route dispatched and recorded into history log.',
      route: saved
    });
  } catch (error) {
    console.error('Error saving route history:', error);
    res.status(500).json({ error: 'Failed to log dispatched route.' });
  }
};

export const getRouteHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const history = await prisma.routeHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });

    res.json({ history });
  } catch (error) {
    console.error('Error fetching route history:', error);
    res.status(500).json({ error: 'Failed to retrieve route history.' });
  }
};

export const explainRouteCustom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      originName,
      destinationName,
      emergencyType,
      selectedRoute,
      alternativeRoutes,
      avoidedIncidentsCount,
      rerouteOccurred,
      rerouteDetails
    } = req.body;

    const explanation = await generateRouteExplanation({
      originName,
      destinationName,
      emergencyType,
      selectedRoute,
      alternativeRoutes: alternativeRoutes || [],
      avoidedIncidentsCount: avoidedIncidentsCount || 0,
      rerouteOccurred: Boolean(rerouteOccurred),
      rerouteDetails
    });

    res.json({ explanation });
  } catch (error) {
    console.error('Error in route explanation:', error);
    res.status(500).json({ error: 'Failed to generate AI route rationale.' });
  }
};

export const compareRoutesCustom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { originName, destinationName, emergencyType, routes } = req.body;

    if (!originName || !destinationName || !routes || !Array.isArray(routes)) {
      res.status(400).json({ error: 'originName, destinationName, and routes array are required.' });
      return;
    }

    const { generateRouteComparison } = await import('../services/geminiService');
    const comparison = await generateRouteComparison({
      originName: String(originName),
      destinationName: String(destinationName),
      emergencyType: String(emergencyType || 'Code 3 - Critical Trauma'),
      routes
    });

    res.json({ comparison });
  } catch (error) {
    console.error('Error in route comparison:', error);
    res.status(500).json({ error: 'Failed to generate AI route comparison.' });
  }
};

export const recommendRecoveryCustom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      incidentTitle,
      locationName,
      severity,
      clearedOrActive,
      blockedCorridors,
      availableAlternatives
    } = req.body;

    if (!incidentTitle || !locationName) {
      res.status(400).json({ error: 'incidentTitle and locationName are required.' });
      return;
    }

    const { generateRecoveryRecommendations } = await import('../services/geminiService');
    const recovery = await generateRecoveryRecommendations({
      incidentTitle: String(incidentTitle),
      locationName: String(locationName),
      severity: String(severity || 'CRITICAL'),
      clearedOrActive: clearedOrActive === 'CLEARED' ? 'CLEARED' : 'ACTIVE',
      blockedCorridors: Array.isArray(blockedCorridors) ? blockedCorridors : [],
      availableAlternatives: Array.isArray(availableAlternatives) ? availableAlternatives : []
    });

    res.json({ recovery });
  } catch (error) {
    console.error('Error generating recovery recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recovery recommendations.' });
  }
};
