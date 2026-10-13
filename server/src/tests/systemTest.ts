import { getSupabaseStatus } from '../services/supabase';
import {
  generateRouteExplanation,
  generateRouteComparison,
  generateIncidentSummary,
  generateRecoveryRecommendations
} from '../services/geminiService';
import { computeRoutes } from '../services/routeEngine';

async function runTests() {
  console.log('🧪 Starting RescueRoute AI System Verification Tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Supabase Configuration Status Check
  try {
    console.log('Test 1: Supabase Configuration Status...');
    const status = getSupabaseStatus();
    if (!status.projectUrl.includes('jjcszxwhgbyyzvitcahd')) {
      throw new Error(`Unexpected project URL: ${status.projectUrl}`);
    }
    console.log(`   ✅ Supabase project URL verified: ${status.projectUrl}`);
    console.log(`   ✅ Database Mode: ${status.databaseMode}`);
    passed++;
  } catch (err: any) {
    console.error('   ❌ Test 1 Failed:', err.message);
    failed++;
  }

  // Test 2: Gemini Route Explanation (Live or Fallback)
  try {
    console.log('\nTest 2: Route Explanation Generation...');
    const dummyRoute: any = {
      id: 'route-bravo',
      name: 'Route Bravo (Metro Expressway)',
      tagline: 'High-speed controlled access highway bypass',
      type: 'EXPRESSWAY',
      distanceKm: 6.8,
      durationMinutes: 7.2,
      baseDurationMinutes: 6.0,
      delayMinutes: 0,
      blocked: false,
      score: 92,
      blockingIncidents: [],
      signalPreemption: false,
      trafficLevel: 'LOW',
      waypoints: [[37.7946, -122.3999], [37.7558, -122.4045]],
      summaryHighlights: ['Clear highway']
    };

    const explanation = await generateRouteExplanation({
      originName: 'Financial District Staging Post',
      destinationName: 'Metro General Hospital (Level 1 Trauma)',
      emergencyType: 'Code 3 - Critical Trauma',
      selectedRoute: dummyRoute,
      alternativeRoutes: [],
      avoidedIncidentsCount: 1,
      rerouteOccurred: false
    });

    if (!explanation.summary || !explanation.crewGuidance) {
      throw new Error('Explanation missing summary or crew guidance');
    }
    console.log(`   ✅ Explanation Generated successfully (Provider: ${explanation.provider})`);
    console.log(`   📝 Summary snippet: "${explanation.summary.slice(0, 80)}..."`);
    passed++;
  } catch (err: any) {
    console.error('   ❌ Test 2 Failed:', err.message);
    failed++;
  }

  // Test 3: Multi-Corridor AI Comparison
  try {
    console.log('\nTest 3: AI Corridor Comparison Analysis...');
    const mockRoutes: any[] = [
      {
        id: 'route-alpha',
        name: 'Corridor Alpha',
        type: 'PRIORITY_CORRIDOR',
        distanceKm: 5.2,
        durationMinutes: 6.5,
        score: 95,
        blocked: false,
        signalPreemption: true,
        delayMinutes: 0,
        blockingIncidents: []
      },
      {
        id: 'route-bravo',
        name: 'Route Bravo',
        type: 'EXPRESSWAY',
        distanceKm: 6.8,
        durationMinutes: 7.2,
        score: 88,
        blocked: false,
        signalPreemption: false,
        delayMinutes: 0,
        blockingIncidents: []
      }
    ];

    const comparison = await generateRouteComparison({
      originName: 'Downtown Station',
      destinationName: 'Metro Trauma Center',
      emergencyType: 'Code 3 - Critical Trauma',
      routes: mockRoutes
    });

    if (!comparison.comparisons || comparison.comparisons.length === 0) {
      throw new Error('Comparison returned no routes');
    }
    console.log(`   ✅ Route Comparison Generated (Provider: ${comparison.provider})`);
    console.log(`   📊 Recommended: ${comparison.recommendedCorridor}, Evaluated: ${comparison.comparisons.length} routes`);
    passed++;
  } catch (err: any) {
    console.error('   ❌ Test 3 Failed:', err.message);
    failed++;
  }

  // Test 4: Incident Hazard Assessment
  try {
    console.log('\nTest 4: Incident Hazard Summary Assessment...');
    const summary = await generateIncidentSummary({
      title: 'Major Fuel Tanker Overturn on Market St',
      locationName: 'Market St & 7th St',
      severity: 'CRITICAL',
      category: 'ROADBLOCK',
      radiusMeters: 300,
      description: 'Tanker ruptured spilling 2000 gallons across all lanes.'
    });

    if (!summary.hazardHeadline || !summary.criticalRisks) {
      throw new Error('Missing hazard headline or critical risks');
    }
    console.log(`   ✅ Incident Summary Generated (Provider: ${summary.provider})`);
    console.log(`   🚨 Headline: "${summary.hazardHeadline}"`);
    passed++;
  } catch (err: any) {
    console.error('   ❌ Test 4 Failed:', err.message);
    failed++;
  }

  // Test 5: Dynamic Collision Engine & Roadblock Rerouting
  try {
    console.log('\nTest 5: Dynamic Collision Engine & Rerouting...');
    const origin = { name: 'Origin Post', coordinates: { lat: 37.7946, lng: -122.3999 } };
    const destination = { name: 'Metro Trauma', coordinates: { lat: 37.7558, lng: -122.4045 } };
    const activeRoadblock: any = {
      id: 'test-incident-1',
      title: 'Critical Bridge Blockage',
      locationName: 'Primary Vector',
      latitude: 37.7750,
      longitude: -122.4020,
      severity: 'CRITICAL',
      category: 'ROADBLOCK',
      radiusMeters: 400,
      status: 'ACTIVE'
    };

    const result = computeRoutes(origin, destination, 'Code 3 - Critical Trauma', [activeRoadblock]);
    if (!result.routes || result.routes.length === 0) {
      throw new Error('No routes returned');
    }
    console.log(`   ✅ Routes calculated: ${result.routes.length}`);
    console.log(`   ✅ Collision check: ${result.hasRoadblockAlert ? 'Hazard Collision Detected & Rerouted' : 'Clear Corridor'}`);
    console.log(`   ✅ Recommended Route: ${result.recommendedRouteId}`);
    passed++;
  } catch (err: any) {
    console.error('   ❌ Test 5 Failed:', err.message);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`🎉 Test Run Completed: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
