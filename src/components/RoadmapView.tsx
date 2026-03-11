import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CustomerRequest, GapClassification } from '../types';

const GAP_COLORS: Record<GapClassification, string> = {
  'No Gap': '#10B981',
  'Configuration Gap': '#3B82F6',
  'Partial Gap': '#F59E0B',
  'Feature Gap': '#EF4444',
  'Integration Gap': '#8B5CF6',
  'Unclear': '#6B7280',
};

const PRIORITY_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  'Not Set': 4,
};

interface RoadmapItem {
  theme: string;
  requests: CustomerRequest[];
  customerCount: number;
  customers: string[];
  maxPriority: string;
  signal: string;
}

interface Props {
  requests: CustomerRequest[];
}

export default function RoadmapView({ requests }: Props) {
  // Group related requests into roadmap themes
  const themes = useMemo(() => {
    const gapRequests = requests.filter(
      (r) => r.gapClassification !== 'No Gap' && r.gapClassification !== 'Unclear'
    );

    // Manual thematic grouping based on roadmap signals
    const themeMap: Record<string, { label: string; ids: string[] }> = {
      'attribute-types': {
        label: 'Expanded Attribute Type System',
        ids: ['REQ-001', 'REQ-004', 'REQ-013'],
      },
      'advanced-optimization': {
        label: 'Advanced Optimization & Analytics',
        ids: ['REQ-003', 'REQ-007', 'REQ-015'],
      },
      'project-dependencies': {
        label: 'Project Dependencies & Scheduling',
        ids: ['REQ-005', 'REQ-012'],
      },
      'integration-api': {
        label: 'External System Integration & API',
        ids: ['REQ-002', 'REQ-010', 'REQ-014'],
      },
      'bulk-editing': {
        label: 'Bulk Data Management',
        ids: ['REQ-008'],
      },
      'reporting': {
        label: 'Enhanced Reporting & Export',
        ids: ['REQ-006'],
      },
      'governance': {
        label: 'Role-Based Access & Governance',
        ids: ['REQ-009'],
      },
      'plan-ux': {
        label: 'Plan Visualization Enhancements',
        ids: ['REQ-011', 'REQ-012'],
      },
    };

    const result: RoadmapItem[] = [];
    for (const [, theme] of Object.entries(themeMap)) {
      const themeRequests = theme.ids
        .map((id) => gapRequests.find((r) => r.id === id))
        .filter(Boolean) as CustomerRequest[];
      if (themeRequests.length === 0) continue;

      const customers = [...new Set(themeRequests.map((r) => r.customer))];
      const maxPriority = themeRequests.reduce(
        (best, r) =>
          PRIORITY_ORDER[r.priority] < PRIORITY_ORDER[best] ? r.priority : best,
        'Not Set'
      );

      result.push({
        theme: theme.label,
        requests: themeRequests,
        customerCount: customers.length,
        customers,
        maxPriority,
        signal: themeRequests[0].roadmapSignal,
      });
    }

    // Sort by customer count descending, then by priority
    result.sort((a, b) => {
      if (b.customerCount !== a.customerCount) return b.customerCount - a.customerCount;
      return PRIORITY_ORDER[a.maxPriority] - PRIORITY_ORDER[b.maxPriority];
    });

    return result;
  }, [requests]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Roadmap Signals</h2>
        <p className="text-sm text-gray-500">
          Thematic grouping of customer gaps to inform engineering investment decisions.
          Sorted by cross-customer demand and priority.
        </p>
      </div>

      {/* Investment Pressure Summary */}
      <div className="bg-arcadis-light border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-arcadis-dark mb-3">Investment Pressure Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Highest cross-customer demand:</span>
            <p className="font-semibold text-arcadis-dark mt-1">
              {themes[0]?.theme} ({themes[0]?.customerCount} customers)
            </p>
          </div>
          <div>
            <span className="text-gray-600">Themes with Critical priority:</span>
            <p className="font-semibold text-red-700 mt-1">
              {themes.filter((t) => t.maxPriority === 'Critical').map((t) => t.theme).join(', ') || 'None'}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Total actionable themes:</span>
            <p className="font-semibold text-arcadis-dark mt-1">{themes.length}</p>
          </div>
        </div>
      </div>

      {/* Theme Cards */}
      <div className="space-y-4">
        {themes.map((theme, index) => (
          <div key={theme.theme} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 flex items-start justify-between border-b">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{theme.theme}</h3>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>
                    {theme.customerCount} customer{theme.customerCount !== 1 ? 's' : ''}
                  </span>
                  <span>&middot;</span>
                  <span>
                    {theme.requests.length} request{theme.requests.length !== 1 ? 's' : ''}
                  </span>
                  <span>&middot;</span>
                  <span
                    className={
                      theme.maxPriority === 'Critical'
                        ? 'text-red-600 font-medium'
                        : theme.maxPriority === 'High'
                        ? 'text-orange-600 font-medium'
                        : ''
                    }
                  >
                    Highest: {theme.maxPriority}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex flex-wrap gap-1 justify-end">
                  {theme.customers.map((c) => (
                    <span
                      key={c}
                      className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-gray-700 mb-3">{theme.signal}</p>
              <div className="space-y-2">
                {theme.requests.map((r) => (
                  <Link
                    key={r.id}
                    to={`/requests/${r.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 border border-gray-100 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">{r.id}</span>
                      <span className="text-gray-900">{r.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{r.customer}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: GAP_COLORS[r.gapClassification] + '20',
                          color: GAP_COLORS[r.gapClassification],
                        }}
                      >
                        {r.gapClassification}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <strong>Note:</strong> This roadmap view presents evidence-based signals from customer
        requests to inform investment decisions. Prioritisation and commitment decisions remain
        with the engineering and product leadership team.
      </div>
    </div>
  );
}
