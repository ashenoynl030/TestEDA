import { Link } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import {
  CustomerRequest,
  FeatureTag,
  GapClassification,
  AffectedModule,
  Priority,
} from '../types';

const GAP_COLORS: Record<GapClassification, string> = {
  'No Gap': '#10B981',
  'Configuration Gap': '#3B82F6',
  'Partial Gap': '#F59E0B',
  'Feature Gap': '#EF4444',
  'Integration Gap': '#8B5CF6',
  'Unclear': '#6B7280',
};

const PRIORITY_BADGE: Record<Priority, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800',
  'Not Set': 'bg-gray-100 text-gray-600',
};

const ALL_GAPS: GapClassification[] = [
  'No Gap', 'Configuration Gap', 'Partial Gap', 'Feature Gap', 'Integration Gap', 'Unclear',
];
const ALL_TAGS: FeatureTag[] = [
  'Portfolio Configuration', 'Data Import / Export', 'Project & Solution Management',
  'Measures & Scoring', 'Plans & Decisions', 'Linear Optimisation',
  'Plan Comparisons & Reporting', 'Workflow & Governance', 'Data Integration',
  'UI / UX Enhancement', 'Analytics & Insights', 'Other / Unclear',
];
const ALL_MODULES: AffectedModule[] = [
  'Portfolio Configuration', 'Projects & Solutions', 'Plans', 'Cross-Module',
];
const ALL_PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low', 'Not Set'];

interface Props {
  requests: CustomerRequest[];
  filters: {
    gap?: GapClassification;
    tag?: FeatureTag;
    module?: AffectedModule;
    priority?: Priority;
    search?: string;
  };
  onFilterChange: (f: Props['filters']) => void;
  totalCount: number;
}

export default function RequestList({ requests, filters, onFilterChange, totalCount }: Props) {
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Customer Requests</h2>
        <p className="text-sm text-gray-500">
          Showing {requests.length} of {totalCount} requests
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests by title, customer, ID..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value || undefined })}
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-arcadis-green focus:border-transparent"
            />
          </div>
          {hasFilters && (
            <button
              onClick={() => onFilterChange({})}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            icon={<Filter size={14} />}
            label="Gap Type"
            value={filters.gap}
            options={ALL_GAPS}
            onChange={(v) => onFilterChange({ ...filters, gap: v as GapClassification | undefined })}
          />
          <FilterSelect
            label="Feature Tag"
            value={filters.tag}
            options={ALL_TAGS}
            onChange={(v) => onFilterChange({ ...filters, tag: v as FeatureTag | undefined })}
          />
          <FilterSelect
            label="Module"
            value={filters.module}
            options={ALL_MODULES}
            onChange={(v) => onFilterChange({ ...filters, module: v as AffectedModule | undefined })}
          />
          <FilterSelect
            label="Priority"
            value={filters.priority}
            options={ALL_PRIORITIES}
            onChange={(v) => onFilterChange({ ...filters, priority: v as Priority | undefined })}
          />
        </div>
      </div>

      {/* Request cards */}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No requests match the current filters.
          </div>
        ) : (
          requests.map((r) => (
            <Link
              key={r.id}
              to={`/requests/${r.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">{r.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[r.priority]}`}>
                      {r.priority}
                    </span>
                    {r.followUpRequired && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        Follow-up needed
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{r.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.summary}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{r.customer}</span>
                    <span>{r.submissionDate}</span>
                    <span>AM: {r.accountManager}</span>
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: GAP_COLORS[r.gapClassification] + '20',
                      color: GAP_COLORS[r.gapClassification],
                    }}
                  >
                    {r.gapClassification}
                  </span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {r.featureTags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                    {r.featureTags.length > 2 && (
                      <span className="text-xs text-gray-400">
                        +{r.featureTags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  options: string[];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="appearance-none text-sm border rounded-md px-3 py-1.5 pr-8 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-arcadis-green"
      >
        <option value="">
          {label}: All
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {icon && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          {icon}
        </span>
      )}
    </div>
  );
}
