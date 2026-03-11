import {
  FeatureTag,
  GapClassification,
  AffectedModule,
  AssessedRequirement,
  DocumentAssessment,
} from '../types';

/**
 * Keyword-based rules that map document content to EDAP II baseline capabilities.
 * Each rule captures a pattern of keywords, what it maps to in the taxonomy,
 * and whether the baseline supports it.
 */
interface BaselineRule {
  keywords: string[];
  requireAll?: boolean;
  featureTags: FeatureTag[];
  affectedModules: AffectedModule[];
  gapClassification: GapClassification;
  baselineReference: string;
  roadmapSignal: string;
  summaryTemplate: string;
}

const BASELINE_RULES: BaselineRule[] = [
  // --- Attribute type gaps ---
  {
    keywords: ['numeric', 'number', 'score', 'rating', 'integer', 'decimal', 'numeric attribute'],
    featureTags: ['Portfolio Configuration'],
    affectedModules: ['Portfolio Configuration'],
    gapClassification: 'Feature Gap',
    baselineReference: 'Module 1: Attributes — Only String (max 100 chars) and Boolean types supported. No numeric attribute type exists.',
    roadmapSignal: 'Introduce a Numeric attribute data type. Recurring cross-customer pattern.',
    summaryTemplate: 'Request involves numeric/scored data as project attributes, which is not supported by current attribute types.',
  },
  {
    keywords: ['dropdown', 'picklist', 'enumeration', 'enum', 'select list', 'predefined values', 'standardised categories'],
    featureTags: ['Portfolio Configuration', 'UI / UX Enhancement'],
    affectedModules: ['Portfolio Configuration'],
    gapClassification: 'Feature Gap',
    baselineReference: 'Module 1: Attributes — Only String and Boolean types supported. No dropdown/enumeration attribute type exists.',
    roadmapSignal: 'Add Enum/Dropdown attribute type with admin-configurable options list.',
    summaryTemplate: 'Request involves constrained selection lists or dropdown attributes not supported in current attribute types.',
  },
  {
    keywords: ['date', 'completion date', 'target date', 'deadline', 'date attribute', 'date field'],
    featureTags: ['Portfolio Configuration'],
    affectedModules: ['Portfolio Configuration'],
    gapClassification: 'Feature Gap',
    baselineReference: 'Module 1: Attributes — Only String and Boolean types supported. No date attribute type exists.',
    roadmapSignal: 'Add Date attribute type with date-picker UI and chronological sorting.',
    summaryTemplate: 'Request involves date-based project metadata not supported by current attribute types.',
  },

  // --- Integration gaps ---
  {
    keywords: ['integration', 'connect', 'sync', 'API', 'asset management', 'ERP', 'SAP', 'Ellipse', 'Maximo'],
    featureTags: ['Data Integration', 'Data Import / Export'],
    affectedModules: ['Projects & Solutions'],
    gapClassification: 'Integration Gap',
    baselineReference: 'Module 2: Bulk Import — Only CSV import supported. No native API-based project creation or external system connectors.',
    roadmapSignal: 'Build integration API layer or connector framework for external system data pulls.',
    summaryTemplate: 'Request involves connecting EDAP II to an external system, which is not currently supported beyond CSV import.',
  },
  {
    keywords: ['GIS', 'map', 'geographic', 'spatial', 'location', 'coordinates', 'geospatial'],
    featureTags: ['Data Integration', 'UI / UX Enhancement', 'Analytics & Insights'],
    affectedModules: ['Cross-Module'],
    gapClassification: 'Feature Gap',
    baselineReference: 'No GIS or spatial visualization capability documented in any EDAP II module.',
    roadmapSignal: 'Add GIS/map visualization module with spatial attribute type and mapping library integration.',
    summaryTemplate: 'Request involves geographic/spatial visualization capabilities not present in EDAP II.',
  },
  {
    keywords: ['Power BI', 'Tableau', 'BI tool', 'business intelligence', 'data warehouse'],
    featureTags: ['Data Import / Export', 'Data Integration'],
    affectedModules: ['Plans'],
    gapClassification: 'Configuration Gap',
    baselineReference: 'Module 3: Manage Data — Export via CSV or API link is documented. May partially address BI integration needs.',
    roadmapSignal: 'Ensure existing API link supports authentication and granularity required for BI tool integration.',
    summaryTemplate: 'Request involves BI tool integration, which may be partially addressed by existing API export links.',
  },

  // --- Optimization gaps ---
  {
    keywords: ['Pareto', 'multi-objective', 'efficient frontier', 'trade-off', 'tradeoff'],
    featureTags: ['Linear Optimisation', 'Analytics & Insights'],
    affectedModules: ['Plans'],
    gapClassification: 'Feature Gap',
    baselineReference: 'Module 3: Linear Optimisation — Only single-objective with weighted multi-goal supported. No Pareto frontier analysis.',
    roadmapSignal: 'Implement multi-objective optimization with Pareto frontier generation and visualization.',
    summaryTemplate: 'Request involves multi-objective optimization or Pareto frontier analysis not supported by current optimizer.',
  },
  {
    keywords: ['sensitivity', 'what-if', 'scenario analysis', 'shadow price', 'constraint sensitivity'],
    featureTags: ['Linear Optimisation', 'Analytics & Insights'],
    affectedModules: ['Plans'],
    gapClassification: 'Feature Gap',
    baselineReference: 'Module 3: Known limitations — No scenario sensitivity/uncertainty modelling exists.',
    roadmapSignal: 'Implement parametric sensitivity analysis exposing shadow prices from LP solver.',
    summaryTemplate: 'Request involves sensitivity or what-if analysis not currently available in EDAP II.',
  },
  {
    keywords: ['Monte Carlo', 'risk-adjusted', 'uncertainty', 'probabilistic', 'stochastic', 'risk distribution'],
    featureTags: ['Linear Optimisation', 'Analytics & Insights'],
    affectedModules: ['Plans'],
    gapClassification: 'Feature Gap',
    baselineReference: 'Module 3: Known limitations — No native risk-adjusted optimisation or uncertainty modelling.',
    roadmapSignal: 'Implement stochastic optimization or Monte Carlo simulation layer for probabilistic plan outcomes.',
    summaryTemplate: 'Request involves probabilistic/risk-adjusted optimization not supported by EDAP II.',
  },
  {
    keywords: ['re-optimise', 're-optimize', 'stale plan', 'auto-refresh', 'rerun optimization'],
    featureTags: ['Linear Optimisation', 'Plans & Decisions'],
    affectedModules: ['Plans'],
    gapClassification: 'Feature Gap',
    baselineReference: 'Module 3: Known limitations — No automated re-optimisation when project data changes.',
    roadmapSignal: 'Implement staleness detection and one-click re-optimization when project data changes.',
    summaryTemplate: 'Request involves automated re-optimization when underlying data changes.',
  },

  // --- Project & Solution gaps ---
  {
    keywords: ['dependency', 'dependencies', 'sequencing', 'predecessor', 'successor', 'critical path'],
    featureTags: ['Project & Solution Management', 'Linear Optimisation'],
    affectedModules: ['Projects & Solutions', 'Plans'],
    gapClassification: 'Feature Gap',
    baselineReference: 'Module 2: Known limitations — No project dependencies or sequencing constraints. Module 3: No scheduling tool integration.',
    roadmapSignal: 'Introduce dependency graph model at project level and extend optimizer for sequencing constraints.',
    summaryTemplate: 'Request involves project dependencies or sequencing constraints not supported in EDAP II.',
  },
  {
    keywords: ['bulk edit', 'mass update', 'batch update', 'update multiple', 'edit multiple projects'],
    featureTags: ['Project & Solution Management', 'UI / UX Enhancement'],
    affectedModules: ['Projects & Solutions'],
    gapClassification: 'Partial Gap',
    baselineReference: 'Module 2: CSV re-import can update existing projects by GUID. UI only supports individual project editing.',
    roadmapSignal: 'Build bulk measure editing UI with multi-select and formula-based transformations.',
    summaryTemplate: 'Request involves bulk editing across multiple projects, partially addressed by CSV re-import but lacking a UI.',
  },

  // --- Reporting gaps ---
  {
    keywords: ['PowerPoint', 'PPTX', 'presentation', 'board report', 'slide'],
    featureTags: ['Plan Comparisons & Reporting', 'Data Import / Export'],
    affectedModules: ['Plans'],
    gapClassification: 'Feature Gap',
    baselineReference: 'Module 3: Plan Comparisons — Export supported as combined CSVs only. No PowerPoint export.',
    roadmapSignal: 'Add report generation feature outputting formatted PowerPoint slides from Plan Comparisons.',
    summaryTemplate: 'Request involves PowerPoint or presentation export not available in EDAP II.',
  },
  {
    keywords: ['dashboard', 'real-time dashboard', 'KPI dashboard', 'analytics dashboard'],
    featureTags: ['Analytics & Insights', 'UI / UX Enhancement'],
    affectedModules: ['Cross-Module'],
    gapClassification: 'Feature Gap',
    baselineReference: 'No real-time analytics dashboard documented in EDAP II beyond Plan Measures charts.',
    roadmapSignal: 'Consider a customizable analytics dashboard layer with configurable KPI widgets.',
    summaryTemplate: 'Request involves advanced dashboard or analytics capabilities beyond current Plan Measures views.',
  },

  // --- Workflow / Governance gaps ---
  {
    keywords: ['role-based', 'RBAC', 'permission', 'access control', 'user role', 'authorization'],
    featureTags: ['Workflow & Governance'],
    affectedModules: ['Cross-Module'],
    gapClassification: 'Partial Gap',
    baselineReference: 'Module 1: Workflow support exists (Project/Plan workflows). No fine-grained RBAC documented.',
    roadmapSignal: 'Extend governance framework to include role-based permissions (Viewer, Editor, Approver, Admin).',
    summaryTemplate: 'Request involves role-based access control, partially addressed by existing workflows but lacking fine-grained permissions.',
  },
  {
    keywords: ['audit trail', 'audit log', 'change history', 'track changes', 'compliance'],
    featureTags: ['Workflow & Governance'],
    affectedModules: ['Cross-Module'],
    gapClassification: 'Partial Gap',
    baselineReference: 'Module 2: Versioning — All project edits are version-controlled with archived versions. No dedicated audit trail or compliance log documented.',
    roadmapSignal: 'Formalize versioning into a searchable audit trail with user attribution and timestamps.',
    summaryTemplate: 'Request involves audit/compliance logging, partially covered by version history but lacking a formal audit trail.',
  },

  // --- Baseline-supported capabilities (No Gap) ---
  {
    keywords: ['CSV import', 'bulk import', 'import projects'],
    featureTags: ['Data Import / Export'],
    affectedModules: ['Projects & Solutions'],
    gapClassification: 'No Gap',
    baselineReference: 'Module 2: Bulk Import — Projects can be bulk-imported via four CSV files (Projects.csv, ProjectMeasures.csv, Solutions.csv, SolutionMeasures.csv).',
    roadmapSignal: 'No action required — CSV bulk import is a current capability.',
    summaryTemplate: 'Request involves CSV-based project import, which is fully supported.',
  },
  {
    keywords: ['plan comparison', 'compare plans', 'side-by-side'],
    featureTags: ['Plan Comparisons & Reporting'],
    affectedModules: ['Plans'],
    gapClassification: 'No Gap',
    baselineReference: 'Module 3: Plan Comparisons — Multiple plans can be compared side-by-side with color-coded charts and exported as combined CSVs.',
    roadmapSignal: 'No action required — plan comparison is a current capability.',
    summaryTemplate: 'Request involves comparing multiple plans, which is fully supported.',
  },
  {
    keywords: ['optimization', 'optimise', 'optimize', 'linear optimisation', 'goals and bounds'],
    featureTags: ['Linear Optimisation'],
    affectedModules: ['Plans'],
    gapClassification: 'No Gap',
    baselineReference: 'Module 3: Linear Optimisation — Users define Goals and Bounds; the optimizer generates optimal decisions. Supports weighted multi-goal with configurable timestep ranges.',
    roadmapSignal: 'No action required — basic linear optimisation is a current capability.',
    summaryTemplate: 'Request involves basic optimization, which is supported by the current Linear Optimisation module.',
  },
  {
    keywords: ['workflow', 'approval', 'approval process', 'sign-off'],
    featureTags: ['Workflow & Governance'],
    affectedModules: ['Cross-Module'],
    gapClassification: 'No Gap',
    baselineReference: 'Module 1: Workflow support — Project and Plan workflows can be assigned. Module 2: Approval workflows activate on project commitment.',
    roadmapSignal: 'No action required — basic workflow and approval is a current capability.',
    summaryTemplate: 'Request involves approval workflows, which are supported at the configuration level.',
  },
  {
    keywords: ['Gantt', 'Gantt chart', 'timeline view'],
    featureTags: ['Plans & Decisions', 'UI / UX Enhancement'],
    affectedModules: ['Plans'],
    gapClassification: 'Partial Gap',
    baselineReference: 'Module 3: Plan Decisions — Gantt chart view exists. No milestone markers or critical path analysis documented.',
    roadmapSignal: 'Enhance Gantt chart with milestones and critical path if dependency data becomes available.',
    summaryTemplate: 'Request involves Gantt chart capabilities — basic view exists but advanced features (milestones, critical path) are missing.',
  },
  {
    keywords: ['CSV export', 'export data', 'download data', 'export plan'],
    featureTags: ['Data Import / Export'],
    affectedModules: ['Plans'],
    gapClassification: 'No Gap',
    baselineReference: 'Module 3: Manage Data — Plan data can be exported as CSV (PlanMeasures.csv, PlanDecisions.csv, PlanDecisionMeasures.csv) or via API link.',
    roadmapSignal: 'No action required — CSV export is a current capability.',
    summaryTemplate: 'Request involves data export, which is fully supported via CSV and API link.',
  },
  {
    keywords: ['time-to-benefit', 'TTB', 'benefit offset', 'deferred benefit'],
    featureTags: ['Measures & Scoring'],
    affectedModules: ['Projects & Solutions'],
    gapClassification: 'No Gap',
    baselineReference: 'Module 2: Solution Measures — Time-to-Benefit (TTB) is supported via empty values in leading timesteps.',
    roadmapSignal: 'No action required — Time-to-Benefit is a current capability.',
    summaryTemplate: 'Request involves time-to-benefit/deferred benefits, which is supported via solution measure TTB.',
  },
];

/**
 * Split document text into individual requirement-like segments.
 * Looks for numbered lists, bullet points, or sentence boundaries that
 * appear to describe distinct needs.
 */
function extractRequirements(text: string): string[] {
  // Split on common requirement patterns: numbered items, bullets, or paragraph breaks
  const lines = text.split(/\n+/);
  const segments: string[] = [];
  let currentSegment = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentSegment.trim()) {
        segments.push(currentSegment.trim());
        currentSegment = '';
      }
      continue;
    }

    // Check if this line starts a new numbered/bulleted item
    const isNewItem = /^(\d+[\.\)]\s|[-*]\s|[a-z][\.\)]\s|#{1,3}\s)/i.test(trimmed);

    if (isNewItem && currentSegment.trim()) {
      segments.push(currentSegment.trim());
      currentSegment = trimmed.replace(/^(\d+[\.\)]\s|[-*]\s|[a-z][\.\)]\s|#{1,3}\s)/i, '');
    } else if (isNewItem) {
      currentSegment = trimmed.replace(/^(\d+[\.\)]\s|[-*]\s|[a-z][\.\)]\s|#{1,3}\s)/i, '');
    } else {
      currentSegment += ' ' + trimmed;
    }
  }
  if (currentSegment.trim()) {
    segments.push(currentSegment.trim());
  }

  // Filter out very short segments (likely headers or noise) and very long segments (split further by sentences)
  const result: string[] = [];
  for (const seg of segments) {
    if (seg.length < 15) continue;
    if (seg.length > 500) {
      // Split long segments by sentence boundaries
      const sentences = seg.match(/[^.!?]+[.!?]+/g) || [seg];
      let current = '';
      for (const s of sentences) {
        if ((current + s).length > 400 && current) {
          result.push(current.trim());
          current = s;
        } else {
          current += s;
        }
      }
      if (current.trim()) result.push(current.trim());
    } else {
      result.push(seg);
    }
  }

  return result.length > 0 ? result : [text.trim()].filter(t => t.length >= 15);
}

/**
 * Match a text segment against baseline rules and return the best-matching rule.
 */
function matchRule(text: string): { rule: BaselineRule; score: number } | null {
  const lower = text.toLowerCase();
  let bestMatch: { rule: BaselineRule; score: number } | null = null;

  for (const rule of BASELINE_RULES) {
    let matchedKeywords = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        matchedKeywords++;
      }
    }

    if (matchedKeywords === 0) continue;

    // Score: proportion of keywords matched, weighted by total matches
    const score = (matchedKeywords / rule.keywords.length) * matchedKeywords;

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { rule, score };
    }
  }

  return bestMatch;
}

/**
 * Assess a full document's text content against the EDAP II baseline.
 */
export function assessDocument(
  documentId: string,
  fileName: string,
  textContent: string
): DocumentAssessment {
  const segments = extractRequirements(textContent);
  const requirements: AssessedRequirement[] = [];
  let reqCounter = 1;

  for (const segment of segments) {
    const match = matchRule(segment);

    if (match) {
      const confidence: 'High' | 'Medium' | 'Low' =
        match.score >= 2 ? 'High' : match.score >= 1 ? 'Medium' : 'Low';

      requirements.push({
        id: `${documentId}-R${String(reqCounter).padStart(3, '0')}`,
        extractedText: segment,
        summary: match.rule.summaryTemplate,
        featureTags: match.rule.featureTags,
        affectedModules: match.rule.affectedModules,
        gapClassification: match.rule.gapClassification,
        baselineReference: match.rule.baselineReference,
        roadmapSignal: match.rule.roadmapSignal,
        confidence,
      });
    } else {
      // Unmatched segment — flag as unclear if it looks like a requirement
      const looksLikeRequirement =
        /\b(shall|must|should|need|require|want|expect|capability|feature|support|enable|provide|allow)\b/i.test(segment);

      if (looksLikeRequirement) {
        requirements.push({
          id: `${documentId}-R${String(reqCounter).padStart(3, '0')}`,
          extractedText: segment,
          summary: 'Requirement detected but could not be confidently mapped to EDAP II baseline. Manual review recommended.',
          featureTags: ['Other / Unclear'],
          affectedModules: ['Cross-Module'],
          gapClassification: 'Unclear',
          baselineReference: 'No baseline coverage — could not match to documented EDAP II capabilities.',
          roadmapSignal: 'Requires manual assessment by product team to determine gap status.',
          confidence: 'Low',
        });
      }
    }

    reqCounter++;
  }

  // Build summary
  const byGap: Record<string, number> = {};
  let highConfidenceCount = 0;
  for (const r of requirements) {
    byGap[r.gapClassification] = (byGap[r.gapClassification] || 0) + 1;
    if (r.confidence === 'High') highConfidenceCount++;
  }

  return {
    documentId,
    fileName,
    assessedAt: new Date().toISOString(),
    requirements,
    summary: {
      total: requirements.length,
      byGap,
      featureGapCount: byGap['Feature Gap'] || 0,
      highConfidenceCount,
    },
  };
}
