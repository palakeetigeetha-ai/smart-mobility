import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth';

export const getIncidents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const whereClause: any = {};

    if (status && status !== 'ALL') {
      whereClause.status = status as string;
    }

    const incidents = await prisma.incident.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ incidents });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch road incidents.' });
  }
};

export const createIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      locationName,
      latitude,
      longitude,
      severity,
      category,
      radiusMeters
    } = req.body;

    if (!title || !locationName || latitude === undefined || longitude === undefined) {
      res.status(400).json({
        error: 'Title, location name, latitude, and longitude are required.'
      });
      return;
    }

    const incident = await prisma.incident.create({
      data: {
        title: title.trim(),
        description: description?.trim() || 'Simulated roadblock reported via emergency operations.',
        locationName: locationName.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        severity: severity || 'CRITICAL',
        category: category || 'ROADBLOCK',
        status: 'ACTIVE',
        radiusMeters: radiusMeters ? parseInt(radiusMeters, 10) : 250,
        reportedBy: req.user?.name || 'Dispatcher Field Agent'
      }
    });

    res.status(201).json({
      message: 'Roadblock incident reported and activated successfully',
      incident
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Failed to create incident.' });
  }
};

export const resolveIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Incident not found.' });
      return;
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        clearedAt: new Date()
      }
    });

    res.json({
      message: 'Roadblock cleared and resolved. Corridor opened for transit.',
      incident: updated
    });
  } catch (error) {
    console.error('Error resolving incident:', error);
    res.status(500).json({ error: 'Failed to resolve incident.' });
  }
};

export const toggleIncidentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Incident not found.' });
      return;
    }

    const newStatus = existing.status === 'ACTIVE' ? 'RESOLVED' : 'ACTIVE';
    const updated = await prisma.incident.update({
      where: { id },
      data: {
        status: newStatus,
        clearedAt: newStatus === 'RESOLVED' ? new Date() : null
      }
    });

    res.json({
      message: `Incident marked as ${newStatus}`,
      incident: updated
    });
  } catch (error) {
    console.error('Error toggling incident:', error);
    res.status(500).json({ error: 'Failed to toggle incident status.' });
  }
};

export const deleteIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Incident not found.' });
      return;
    }

    await prisma.incident.delete({ where: { id } });

    res.json({ message: 'Incident removed from tracking log.' });
  } catch (error) {
    console.error('Error deleting incident:', error);
    res.status(500).json({ error: 'Failed to delete incident.' });
  }
};

export const summarizeIncident = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, locationName, severity, category, radiusMeters, description } = req.body;

    if (!title || !locationName) {
      res.status(400).json({ error: 'Title and locationName are required.' });
      return;
    }

    const { generateIncidentSummary } = await import('../services/geminiService');
    const summary = await generateIncidentSummary({
      title: String(title),
      locationName: String(locationName),
      severity: String(severity || 'CRITICAL'),
      category: String(category || 'ROADBLOCK'),
      radiusMeters: Number(radiusMeters) || 250,
      description: String(description || 'Active roadway obstruction.')
    });

    res.json({ summary });
  } catch (error) {
    console.error('Error summarizing incident:', error);
    res.status(500).json({ error: 'Failed to generate incident summary.' });
  }
};
