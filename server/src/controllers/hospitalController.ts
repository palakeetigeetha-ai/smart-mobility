import { Request, Response } from 'express';
import prisma from '../prisma';

export const getHospitals = async (_req: Request, res: Response): Promise<void> => {
  try {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { traumaLevel: 'asc' }
    });
    res.json({ hospitals });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ error: 'Failed to fetch hospital facilities.' });
  }
};

export const getHospitalById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const hospital = await prisma.hospital.findUnique({
      where: { id }
    });

    if (!hospital) {
      res.status(404).json({ error: 'Hospital not found.' });
      return;
    }

    res.json({ hospital });
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({ error: 'Failed to fetch hospital details.' });
  }
};
