import { useMemo, useState } from 'react';
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

const GAP_DESCRIPTIONS: Record<GapClassification, string> = {
  'No Gap': 'Fully supported by current EDAP II functionality',
  'Configuration Gap': 'Capability exists but requires setup that is not well documented or accessible',
  'Partial Gap': 'EDAP II partially addresses the need but is missing key aspects',
  'Feature Gap': 'Does not exist in EDAP II and would require new development',
  'Integration Gap': 'Involves connecting EDAP II to an external system not currently supported',
  'Unclear': 'Insufficient detail to make a determination — flagged for follow-up',
};

const ALL_GAPS: GapClassification[] = [
  'Feature Gap', 'Partial Gap', 'Integration Gap', 'Configuration Gap', 'No Gap', 'Unclear',
];

interface Props {
  requests: CustomerRequest[];
}

export default function GapAnalysis({ requests }: Props) {
  const [selectedGap, setSelectedGap] = useState<GapClassification | 'All'>('All');

  const grouped = useMemo(() => {
    const result: Record<GapClassification, CustomerRequest[]> = {
      'No Gap': [],
      'Configuration Gap': [],
      'Partial Gap': [],
      'Feature Gap': [],
      'Integration Gap': [],
      'Unclear': [],
    };
    for (const r of requests) {
      result[r.gapClassification].push(r);
    }
    return result;
  }, [requests]);

  const gapsToShow = selectedGap === 'All' ? ALL_GAPS : [selectedGap];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gap Analysis</h2>
        <p className="text-sm text-gray-500">
          Assessment of customer requests against the EDAP II baseline capabilities
        </p>
      </div>

      {/* Gap Type Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {ALL_GAPS.map((gap) => (
          <button
            key={gap}
            onClick={() => setSelectedGap(selectedGap === gap ? 'All' : gap)}
            className={`rounded-lg p-4 text-left transition-all border-2 ${
              selectedGap === gap
                ? 'border-gray-800 shadow-md'
                : 'border-transparent hover:border-gray-200'
            }`}
            style={{ backgroundColor: GAP_COLORS[gap] + '15' }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: GAP_COLORS[gap] }}
            >
              {grouped[gap].length}
            </div>
            <div className="text-xs font-medium text-gray-700 mt-1">{gap}</div>
          </button>
        ))}
      </div>

      {/* Gap Sections */}
      {gapsToShow.map((gap) => {
        const items = grouped[gap];
        if (items.length === 0) return null;

        return (
          <div key={gap} className="bg-white rounded-lg shadow overflow-hidden">
            <div
              className="px-6 py-4 border-l-4"
              style={{ borderColor: GAP_COLORS[gap] }}
            >
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: GAP_COLORS[gap] }}
                />
                {gap}
                <span className="text-sm font-normal text-gray-500">
                  ({items.length} request{items.length !== 1 ? 's' : ''})
                </span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">{GAP_DESCRIPTIONS[gap]}</p>
            </div>
            <div className="divide-y">
              {items.map((r) => (
                <div key={r.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400">{r.id}</span>
                        <Link
                          to={`/requests/${r.id}`}
                          className="font-medium text-gray-900 hover:text-arcadis-green"
                        >
                          {r.title}
                        </Link>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{r.summary}</p>
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Baseline: </span>
                        <span className="text-gray-700">{r.baselineReference}</span>
                      </div>
                      {r.roadmapSignal !== 'No action required' && (
                        <div className="mt-1 text-sm">
                          <span className="text-gray-500">Signal: </span>
                          <span className="text-arcadis-dark font-medium">{r.roadmapSignal}</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-right text-xs text-gray-500">
                      <div>{r.customer}</div>
                      <div className="mt-1">{r.priority}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
