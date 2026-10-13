import { RouteOption } from './routeEngine';

export interface RouteExplanationParams {
  originName: string;
  destinationName: string;
  emergencyType: string;
  selectedRoute: RouteOption;
  alternativeRoutes: RouteOption[];
  avoidedIncidentsCount: number;
  rerouteOccurred: boolean;
  rerouteDetails?: {
    originalBlockedRoute: string;
    incidentCausingDetour: string;
  };
}

export interface RouteExplanationResult {
  summary: string;
  rationale: string[];
  crewGuidance: string;
  hazardsMitigated: string[];
  provider: 'GEMINI_AI' | 'TACTICAL_FALLBACK';
  timestamp: string;
}

export interface RouteComparisonParams {
  originName: string;
  destinationName: string;
  emergencyType: string;
  routes: RouteOption[];
}

export interface RouteComparisonResult {
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

export interface IncidentSummaryParams {
  title: string;
  locationName: string;
  severity: string;
  category: string;
  radiusMeters: number;
  description: string;
  affectedCorridorCount?: number;
}

export interface IncidentSummaryResult {
  hazardHeadline: string;
  impactAssessment: string;
  criticalRisks: string[];
  transitImplications: string;
  containmentRecommendation: string;
  provider: 'GEMINI_AI' | 'TACTICAL_FALLBACK';
}

export interface RecoveryRecommendationParams {
  incidentTitle: string;
  locationName: string;
  severity: string;
  clearedOrActive: 'ACTIVE' | 'CLEARED';
  blockedCorridors: string[];
  availableAlternatives: string[];
}

export interface RecoveryRecommendationResult {
  operationalStatus: string;
  actionItems: string[];
  trafficSignalPreemptionGuidance: string;
  traumaCenterPreparationNotice: string;
  corridorReopeningProtocol: string;
  provider: 'GEMINI_AI' | 'TACTICAL_FALLBACK';
}

function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key.includes('placeholder') || key === 'your_gemini_api_key_here') {
    return null;
  }
  return key.trim();
}

async function callGeminiApi(prompt: string, maxTokens: number = 800): Promise<any | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}. Using tactical fallback.`);
      return null;
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawContent) {
      return JSON.parse(rawContent);
    }
    return null;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Gemini API call timed out or failed. Falling back to tactical engine.');
    return null;
  }
}

// 1. Emergency Route Risk Explanation
export async function generateRouteExplanation(
  params: RouteExplanationParams
): Promise<RouteExplanationResult> {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    const prompt = `You are the lead AI Dispatch Tactician for RescueRoute AI emergency operations.
Analyze this ambulance routing scenario and return valid JSON:
Origin: ${params.originName}
Destination (Hospital): ${params.destinationName}
Emergency Code: ${params.emergencyType}
Selected Route: ${params.selectedRoute.name} (${params.selectedRoute.distanceKm} km, ETA: ${params.selectedRoute.durationMinutes}m, Score: ${params.selectedRoute.score}/100)
Signal Preemption: ${params.selectedRoute.signalPreemption ? 'ENABLED' : 'DISABLED'}
Alternative Corridors:
${params.alternativeRoutes
  .map(
    (r) =>
      `- ${r.name}: ${r.distanceKm} km, ${r.durationMinutes}m, ${r.blocked ? 'BLOCKED by ' + r.blockingIncidents.map((i) => i.title).join(', ') : 'Open'}`
  )
  .join('\n')}
Rerouted due to Roadblock: ${params.rerouteOccurred ? `YES (Detour away from ${params.rerouteDetails?.incidentCausingDetour})` : 'NO'}

Respond ONLY with valid JSON:
{
  "summary": "2-sentence tactical summary why this route is the optimal choice for patient survival and speed",
  "rationale": [
    "Key reason 1 analyzing time/traffic advantages",
    "Key reason 2 analyzing safety and roadblock avoidance",
    "Key reason 3 analyzing infrastructure suitability"
  ],
  "crewGuidance": "Direct actionable instructions to ambulance driver (siren protocol, lane choice, transition)",
  "hazardsMitigated": [
    "Hazard 1 bypassed",
    "Hazard 2 bypassed"
  ]
}`;

    const parsed = await callGeminiApi(prompt);
    if (parsed && parsed.summary) {
      return {
        summary: parsed.summary,
        rationale: Array.isArray(parsed.rationale) ? parsed.rationale : [],
        crewGuidance: parsed.crewGuidance || 'Proceed Code 3 with standard siren preemption.',
        hazardsMitigated: Array.isArray(parsed.hazardsMitigated) ? parsed.hazardsMitigated : [],
        provider: 'GEMINI_AI',
        timestamp: new Date().toISOString()
      };
    }
  }

  return generateRuleBasedTacticalExplanation(params);
}

// 2. Comprehensive Multi-Route Comparison
export async function generateRouteComparison(
  params: RouteComparisonParams
): Promise<RouteComparisonResult> {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    const prompt = `You are the lead AI Dispatch Tactician for RescueRoute AI.
Evaluate and compare all emergency transit corridors from ${params.originName} to ${params.destinationName} (${params.emergencyType}):
Corridors:
${params.routes
  .map(
    (r) =>
      `- ${r.name} (${r.type}): ${r.distanceKm} km, ETA ${r.durationMinutes} min, Score: ${r.score}/100, Status: ${r.blocked ? 'BLOCKED' : 'CLEAR'}, Preemption: ${r.signalPreemption}`
  )
  .join('\n')}

Respond ONLY with valid JSON:
{
  "overview": "Synthesized executive evaluation of the transit corridor environment",
  "recommendedCorridor": "Name of best corridor",
  "comparisons": [
    {
      "routeName": "Route Name",
      "strategicVerdict": "Short verdict",
      "patientRiskLevel": "LOW|MODERATE|HIGH|CRITICAL",
      "trafficVolatility": "Description of traffic stability",
      "keyAdvantage": "Primary advantage",
      "keyDrawback": "Primary trade-off or risk"
    }
  ],
  "tacticalTradeoffs": [
    "Tradeoff comparison 1",
    "Tradeoff comparison 2"
  ]
}`;

    const parsed = await callGeminiApi(prompt);
    if (parsed && parsed.comparisons) {
      return {
        overview: parsed.overview || 'Multi-corridor comparative evaluation completed.',
        recommendedCorridor: parsed.recommendedCorridor || params.routes[0]?.name || '',
        comparisons: Array.isArray(parsed.comparisons) ? parsed.comparisons : [],
        tacticalTradeoffs: Array.isArray(parsed.tacticalTradeoffs) ? parsed.tacticalTradeoffs : [],
        provider: 'GEMINI_AI'
      };
    }
  }

  // Tactical Fallback for Route Comparison
  return generateRuleBasedRouteComparison(params);
}

// 3. Incident Risk Summary
export async function generateIncidentSummary(
  params: IncidentSummaryParams
): Promise<IncidentSummaryResult> {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    const prompt = `You are the Incident Commander AI for RescueRoute Emergency Network.
Analyze the following roadway obstruction hazard:
Title: ${params.title}
Location: ${params.locationName}
Severity: ${params.severity}
Category: ${params.category}
Radius: ${params.radiusMeters} meters
Description: ${params.description}

Respond ONLY with valid JSON:
{
  "hazardHeadline": "Authoritative alert headline",
  "impactAssessment": "2-sentence impact on emergency trauma ambulance transit",
  "criticalRisks": [
    "Critical risk 1",
    "Critical risk 2",
    "Critical risk 3"
  ],
  "transitImplications": "Detailed operational effect on arterial road velocity",
  "containmentRecommendation": "Actionable perimeter and diversion advice"
}`;

    const parsed = await callGeminiApi(prompt);
    if (parsed && parsed.hazardHeadline) {
      return {
        hazardHeadline: parsed.hazardHeadline,
        impactAssessment: parsed.impactAssessment || 'Hazard imposes localized arterial blockage.',
        criticalRisks: Array.isArray(parsed.criticalRisks) ? parsed.criticalRisks : [],
        transitImplications: parsed.transitImplications || 'Emergency units must divert around incident perimeter.',
        containmentRecommendation: parsed.containmentRecommendation || 'Maintain 300m safety standoff.',
        provider: 'GEMINI_AI'
      };
    }
  }

  // Tactical Fallback for Incident Summary
  return {
    hazardHeadline: `[${params.severity} ALERT] ${params.title} at ${params.locationName}`,
    impactAssessment: `Active ${params.category.toLowerCase()} event creating an estimated ${params.radiusMeters}m disruption radius. Emergency vehicles encountering this bottleneck will experience severe transit delays.`,
    criticalRisks: [
      `Complete blockage of primary arterial lanes within ${params.radiusMeters}m perimeter`,
      `Secondary congestion bleed into adjacent parallel grid intersections`,
      params.severity === 'CRITICAL'
        ? 'Impassable debris or emergency vehicles actively obstructing access'
        : 'Intermittent slowdown with rubbernecking and lane constriction'
    ],
    transitImplications: `All Code 2 and Code 3 units must execute pre-emptive rerouting prior to entering the ${params.locationName} corridor.`,
    containmentRecommendation: `Maintain active traffic sentinel diversion. Recommend dispatcher notification to municipal transit units.`,
    provider: 'TACTICAL_FALLBACK'
  };
}

// 4. Dynamic Recovery Recommendations
export async function generateRecoveryRecommendations(
  params: RecoveryRecommendationParams
): Promise<RecoveryRecommendationResult> {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    const prompt = `You are the lead Recovery Tactician for RescueRoute AI.
Provide recovery recommendations for this emergency incident situation:
Incident: ${params.incidentTitle} (${params.locationName})
Status: ${params.clearedOrActive}
Severity: ${params.severity}
Blocked Corridors: ${params.blockedCorridors.join(', ') || 'None'}
Available Alternatives: ${params.availableAlternatives.join(', ')}

Respond ONLY with valid JSON:
{
  "operationalStatus": "Operational status summary",
  "actionItems": [
    "Immediate action 1",
    "Immediate action 2",
    "Immediate action 3"
  ],
  "trafficSignalPreemptionGuidance": "Guidance on Opticom green wave signaling",
  "traumaCenterPreparationNotice": "Instructions for coordinating with inbound trauma center",
  "corridorReopeningProtocol": "Protocol for reopening or transitioning between routes"
}`;

    const parsed = await callGeminiApi(prompt);
    if (parsed && parsed.operationalStatus) {
      return {
        operationalStatus: parsed.operationalStatus,
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        trafficSignalPreemptionGuidance: parsed.trafficSignalPreemptionGuidance || 'Standard green wave active.',
        traumaCenterPreparationNotice: parsed.traumaCenterPreparationNotice || 'Transmit patient vitals to triage.',
        corridorReopeningProtocol: parsed.corridorReopeningProtocol || 'Verify visual clearance before restoring.',
        provider: 'GEMINI_AI'
      };
    }
  }

  // Tactical Fallback for Recovery
  const isCleared = params.clearedOrActive === 'CLEARED';
  return {
    operationalStatus: isCleared
      ? `Corridor clearance verified for ${params.locationName}. Restoration of primary emergency vector approved.`
      : `Active diversion protocol in effect around ${params.locationName}. Alternate vectors prioritized.`,
    actionItems: isCleared
      ? [
          `Broadcast corridor all-clear notification to active fleet ambulances`,
          `Restore default high-capacity priority corridor routing on dispatched telemetry`,
          `Notify trauma center dispatch that primary inbound corridor is reopened`
        ]
      : [
          `Enforce autonomous detour onto ${params.availableAlternatives[0] || 'designated bypass'}`,
          `Activate Opticom emergency preemption on parallel arterial route`,
          `Alert incoming ambulances 2 km prior to ${params.locationName} junction`
        ],
    trafficSignalPreemptionGuidance: isCleared
      ? 'Deactivate emergency detour signal patterns; return corridor signals to synchronized medical wave.'
      : 'Override local timing plans to extend green phases on active bypass vectors.',
    traumaCenterPreparationNotice: isCleared
      ? 'Advise trauma bay of normalized ETA and direct inbound delivery via primary ramp.'
      : 'Notify trauma team of revised ETA (+3-6 mins) and alternate emergency entrance gate.',
    corridorReopeningProtocol: isCleared
      ? 'Perform safety verification with field units before marking corridor 100% capacity.'
      : 'Maintain standoff perimeter until municipal DPW/Hazmat declares site safe.',
    provider: 'TACTICAL_FALLBACK'
  };
}

// Fallback logic for Route Explanation
function generateRuleBasedTacticalExplanation(
  params: RouteExplanationParams
): RouteExplanationResult {
  const { selectedRoute, alternativeRoutes, rerouteOccurred, rerouteDetails, emergencyType, destinationName } = params;

  const rationale: string[] = [];
  const hazardsMitigated: string[] = [];

  const blockedAlts = alternativeRoutes.filter((r) => r.blocked);
  if (blockedAlts.length > 0) {
    const worstBlocked = blockedAlts[0];
    const delaySaved = Math.max(2, Math.round(worstBlocked.durationMinutes - selectedRoute.durationMinutes));
    rationale.push(
      `Bypasses critical gridlock on ${worstBlocked.name}, saving approximately ${delaySaved} minutes in transit time.`
    );
    worstBlocked.blockingIncidents.forEach((inc) => {
      hazardsMitigated.push(`Avoided active roadblock: ${inc.title} at ${inc.locationName}`);
    });
  } else {
    rationale.push(
      `Fastest eligible corridor with zero active incident interference across all monitored segments.`
    );
  }

  if (selectedRoute.signalPreemption) {
    rationale.push(
      `Equipped with automated Opticom green-wave signal preemption, eliminating cross-traffic collision risks.`
    );
  } else if (selectedRoute.type === 'EXPRESSWAY') {
    rationale.push(
      `Controlled-access highway offers uninterrupted high-speed flow and dedicated emergency breakdown shoulders.`
    );
  } else {
    rationale.push(
      `Parallel arterial layout maintains consistent 40-50 km/h flow with open escape corridors.`
    );
  }

  rationale.push(
    `Overall RescueRoute Suitability Index evaluated at ${selectedRoute.score}/100, prioritizing speed and ride smoothness.`
  );

  let summary = '';
  if (rerouteOccurred) {
    summary = `AUTOMATED REROUTE ACTIVE: ${selectedRoute.name} was designated as the primary survival path after detecting ${rerouteDetails?.incidentCausingDetour || 'major obstacles'} blocking standard thoroughfares. This route secures clear access to ${destinationName} while reducing estimated transit time by up to ${Math.round(selectedRoute.delayMinutes + 6)} minutes.`;
  } else {
    summary = `${selectedRoute.name} is recommended as the top-priority emergency corridor to ${destinationName}. With an ETA of ${selectedRoute.durationMinutes} minutes across ${selectedRoute.distanceKm} km, this path minimizes patient transit stress and avoids regional congestion choke points.`;
  }

  let crewGuidance = '';
  if (emergencyType.includes('Code 3') || emergencyType.includes('Critical')) {
    crewGuidance = `Proceed with Code 3 visual and audible sirens active. Prioritize inner-left lane for traffic clearance. Maintain caution when transitioning off ramps towards ${destinationName}.`;
  } else {
    crewGuidance = `Code 2 expedited transit authorized. Monitor live dispatcher telemetry for dynamic road closures. Coordinate inbound trauma bay prep with ${destinationName}.`;
  }

  if (hazardsMitigated.length === 0) {
    hazardsMitigated.push('Zero active roadblocks or reported hazards along this vector.');
  }

  return {
    summary,
    rationale,
    crewGuidance,
    hazardsMitigated,
    provider: 'TACTICAL_FALLBACK',
    timestamp: new Date().toISOString()
  };
}

// Fallback logic for Route Comparison
function generateRuleBasedRouteComparison(
  params: RouteComparisonParams
): RouteComparisonResult {
  const comparisons = params.routes.map((r) => {
    let risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    let verdict = 'Viable emergency vector';
    let advantage = 'Direct route';
    let drawback = 'Standard street intersections';

    if (r.blocked) {
      risk = 'CRITICAL';
      verdict = 'Ineligible due to active roadblock collision';
      advantage = 'N/A - Impassable';
      drawback = `Blocked by ${r.blockingIncidents[0]?.title || 'Road Hazard'}`;
    } else if (r.type === 'EXPRESSWAY') {
      risk = 'LOW';
      verdict = 'High-velocity bypass with zero traffic lights';
      advantage = 'Grade-separated uninterrupted transit';
      drawback = `${r.distanceKm} km (+25% distance vs direct)`;
    } else if (r.signalPreemption) {
      risk = 'LOW';
      verdict = 'Highest priority urban arterial';
      advantage = 'Opticom signal preemption equipped';
      drawback = 'Higher pedestrian/intersection density';
    } else {
      risk = 'MODERATE';
      verdict = 'Secondary parallel grid fallback';
      advantage = 'Avoids major thoroughfare choke points';
      drawback = 'Moderate intersection stops';
    }

    return {
      routeName: r.name,
      strategicVerdict: verdict,
      patientRiskLevel: risk,
      trafficVolatility: r.blocked ? 'Completely blocked' : r.delayMinutes > 5 ? 'High congestion' : 'Stable free-flow',
      keyAdvantage: advantage,
      keyDrawback: drawback
    };
  });

  const best = params.routes.find((r) => !r.blocked) || params.routes[0];

  return {
    overview: `Comparative evaluation of ${params.routes.length} transit corridors to ${params.destinationName}. Primary selection balances speed, hemodynamic vibration stability, and roadblock clearance.`,
    recommendedCorridor: best?.name || 'Corridor Alpha',
    comparisons,
    tacticalTradeoffs: [
      'Expressway corridors trade longer total kilometers for significantly higher average velocity and ride smoothness.',
      'Surface priority corridors minimize overall distance but are vulnerable to sudden intersection congestion.',
      'Blocked vectors are strictly filtered out to prevent ambulance immobilizations.'
    ],
    provider: 'TACTICAL_FALLBACK'
  };
}
