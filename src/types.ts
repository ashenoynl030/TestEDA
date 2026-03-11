export type FeatureTag =
  | 'Portfolio Configuration'
  | 'Data Import / Export'
  | 'Project & Solution Management'
  | 'Measures & Scoring'
  | 'Plans & Decisions'
  | 'Linear Optimisation'
  | 'Plan Comparisons & Reporting'
  | 'Workflow & Governance'
  | 'Data Integration'
  | 'UI / UX Enhancement'
  | 'Analytics & Insights'
  | 'Other / Unclear';

export type GapClassification =
  | 'No Gap'
  | 'Configuration Gap'
  | 'Partial Gap'
  | 'Feature Gap'
  | 'Integration Gap'
  | 'Unclear';

export type AffectedModule =
  | 'Portfolio Configuration'
  | 'Projects & Solutions'
  | 'Plans'
  | 'Cross-Module';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low' | 'Not Set';

export interface CustomerRequest {
  id: string;
  customer: string;
  submissionDate: string;
  accountManager: string;
  title: string;
  description: string;
  priority: Priority;
  summary: string;
  featureTags: FeatureTag[];
  affectedModules: AffectedModule[];
  gapClassification: GapClassification;
  baselineReference: string;
  roadmapSignal: string;
  followUpRequired: boolean;
  followUpDetails?: string;
}

export interface DashboardStats {
  totalRequests: number;
  byGapType: Record<GapClassification, number>;
  byFeatureTag: Record<FeatureTag, number>;
  byModule: Record<AffectedModule, number>;
  byPriority: Record<Priority, number>;
  followUpCount: number;
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  textContent: string;
  status: 'pending' | 'assessing' | 'assessed' | 'error';
  errorMessage?: string;
}

export interface AssessedRequirement {
  id: string;
  extractedText: string;
  summary: string;
  featureTags: FeatureTag[];
  affectedModules: AffectedModule[];
  gapClassification: GapClassification;
  baselineReference: string;
  roadmapSignal: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface DocumentAssessment {
  documentId: string;
  fileName: string;
  assessedAt: string;
  requirements: AssessedRequirement[];
  summary: {
    total: number;
    byGap: Record<string, number>;
    featureGapCount: number;
    highConfidenceCount: number;
  };
}
