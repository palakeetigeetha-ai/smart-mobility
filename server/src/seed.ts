import bcrypt from 'bcryptjs';
import prisma from './prisma';

async function main() {
  console.log('🚑 Starting RescueRoute AI Database Seeding...');

  // 1. Clear existing seedable entities safely
  await prisma.routeHistory.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Demo Dispatcher User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Emergency123!', salt);

  const demoUser = await prisma.user.create({
    data: {
      email: 'dispatcher@rescueroute.ai',
      passwordHash,
      name: 'Captain Marcus Vance',
      role: 'Lead Dispatcher',
      department: 'Metro Level-1 Emergency Operations Center'
    }
  });
  console.log(`✅ Demo User created: ${demoUser.email} (Password: Emergency123!)`);

  // 3. Seed Hospitals (Realistic Urban Trauma Hubs)
  const hospitalsData = [
    {
      name: 'Metro General Hospital (Level 1 Trauma)',
      address: '1001 Potrero Ave, San Francisco, CA 94110',
      latitude: 37.7558,
      longitude: -122.4045,
      traumaLevel: 'Level 1 Trauma',
      availableBeds: 18,
      specialty: 'Comprehensive Adult & Pediatric Resuscitation',
      contactPhone: '+1 (555) 911-0101',
      status: 'OPERATIONAL'
    },
    {
      name: 'St. Jude Emergency Medical Center',
      address: '350 Parnassus Ave, San Francisco, CA 94143',
      latitude: 37.7634,
      longitude: -122.4578,
      traumaLevel: 'Level 2 Trauma',
      availableBeds: 12,
      specialty: 'Acute Cardiac & Comprehensive Stroke Unit',
      contactPhone: '+1 (555) 911-0202',
      status: 'OPERATIONAL'
    },
    {
      name: 'Presidio Veteran & Regional Care Hub',
      address: '4150 Clement St, San Francisco, CA 94121',
      latitude: 37.7816,
      longitude: -122.5028,
      traumaLevel: 'Emergency Ready',
      availableBeds: 9,
      specialty: 'Hyperbaric & Orthopedic Trauma Care',
      contactPhone: '+1 (555) 911-0303',
      status: 'OPERATIONAL'
    },
    {
      name: 'Embarcadero Harbor Urgent Surgical Wing',
      address: '225 Bush St, San Francisco, CA 94104',
      latitude: 37.7909,
      longitude: -122.4013,
      traumaLevel: 'Level 1 Trauma',
      availableBeds: 15,
      specialty: 'Mass Casualty Triage & Burn Resuscitation',
      contactPhone: '+1 (555) 911-0404',
      status: 'OPERATIONAL'
    }
  ];

  for (const h of hospitalsData) {
    await prisma.hospital.create({ data: h });
  }
  console.log(`✅ Seeded ${hospitalsData.length} Emergency Hospitals`);

  // 4. Seed Simulated Roadblocks & Incidents
  const incidentsData = [
    {
      title: 'Overturned Tanker Pileup on 7th & Market',
      description: 'Major hazardous materials spill with total arterial blockage. Fire crews and hazmat perimeter active.',
      locationName: '7th St & Market St Intersection',
      latitude: 37.7794,
      longitude: -122.4128,
      severity: 'CRITICAL',
      category: 'ROADBLOCK',
      status: 'ACTIVE',
      radiusMeters: 300,
      reportedBy: 'City Traffic Watch Sentinel'
    },
    {
      title: 'Water Main Explosion & Sinkhole',
      description: 'High-pressure water main burst causing 4-meter asphalt fissure. Completely impassable.',
      locationName: 'Mission St & 16th St',
      latitude: 37.7651,
      longitude: -122.4197,
      severity: 'CRITICAL',
      category: 'INFRASTRUCTURE',
      status: 'ACTIVE',
      radiusMeters: 280,
      reportedBy: 'DPW Emergency Unit'
    },
    {
      title: 'Emergency Power Grid Repair',
      description: 'Downed high-voltage utility lines across dual lanes. Utility trucks on scene.',
      locationName: 'Van Ness Ave & Geary Blvd',
      latitude: 37.7865,
      longitude: -122.4215,
      severity: 'MAJOR',
      category: 'ACCIDENT',
      status: 'ACTIVE',
      radiusMeters: 200,
      reportedBy: 'PG&E Tactical Dispatch'
    },
    {
      title: 'Bridge Expansion Joint Maintenance (Cleared)',
      description: 'Overnight scheduled resurfacing successfully completed early. Lanes fully reopened.',
      locationName: 'Bay Bridge Westbound Approach',
      latitude: 37.7915,
      longitude: -122.3892,
      severity: 'MODERATE',
      category: 'ROADBLOCK',
      status: 'RESOLVED',
      radiusMeters: 150,
      clearedAt: new Date(),
      reportedBy: 'Caltrans District 4'
    }
  ];

  for (const inc of incidentsData) {
    await prisma.incident.create({ data: inc });
  }
  console.log(`✅ Seeded ${incidentsData.length} Incident Scenarios`);

  // 5. Seed Route History record for demo
  await prisma.routeHistory.create({
    data: {
      userId: demoUser.id,
      originName: 'Downtown Financial District Dispatch Post',
      originLat: 37.7946,
      originLng: -122.3999,
      destinationName: 'Metro General Hospital (Level 1 Trauma)',
      destLat: 37.7558,
      destLng: -122.4045,
      emergencyType: 'Code 3 - Critical Trauma',
      selectedRouteName: 'Route Bravo (Metro Expressway)',
      distanceKm: 6.8,
      durationMinutes: 7.2,
      aiExplanation: 'Dynamic AI reroute selected Route Bravo via Interstate 280 corridor, bypassing catastrophic hazmat spill on Market Street. Estimated 5.4 minutes saved.',
      incidentsAvoided: 2
    }
  });

  console.log('✅ Demo Route History record created');
  console.log('🚀 Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
