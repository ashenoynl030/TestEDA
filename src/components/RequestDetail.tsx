import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { CustomerRequest, GapClassification } from '../types';

const GAP_COLORS: Record<GapClassification, string> = {
  'No Gap': '#10B981',
  'Configuration Gap': '#3B82F6',
  'Partial Gap': '#F59E0B',
  'Feature Gap': '#EF4444',
  'Integration Gap': '#8B5CF6',
  'Unclear': '#6B7280',
};

const GAP_ICONS: Record<GapClassification, React.ElementType> = {
  'No Gap': CheckCircle,
  'Configuration Gap': Info,
  'Partial Gap': AlertCircle,
  'Feature Gap': AlertCircle,
  'Integration Gap': AlertCircle,
  'Unclear': Info,
};

interface Props {
  requests: CustomerRequest[];
}

export default function RequestDetail({ requests }: Props) {
  const { id } = useParams<{ id: string }>();
  const request = requests.find((r) => r.id === id);

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Request not found.</p>
        <Link to="/requests" className="text-arcadis-green hover:underline mt-2 inline-block">
          Back to requests
        </Link>
      </div>
    );
  }

  const GapIcon = GAP_ICONS[request.gapClassification];
  const gapColor = GAP_COLORS[request.gapClassification];

  // Find related requests (same feature tags)
  const related = requests.filter(
    (r) =>
      r.id !== request.id &&
      r.featureTags.some((t) => request.featureTags.includes(t))
  );

  return (
    <div className="space-y-6">
      <Link
        to="/requests"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-arcadis-green"
      >
        <ArrowLeft size={16} />
        Back to requests
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-gray-400">{request.id}</span>
              <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {request.priority}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{request.title}</h2>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{
              backgroundColor: gapColor + '20',
              color: gapColor,
            }}
          >
            <GapIcon size={16} />
            {request.gapClassification}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t text-sm">
          <div>
            <span className="text-gray-500">Customer</span>
            <p className="font-medium">{request.customer}</p>
          </div>
          <div>
            <span className="text-gray-500">Submitted</span>
            <p className="font-medium">{request.submissionDate}</p>
          </div>
          <div>
            <span className="text-gray-500">Account Manager</span>
            <p className="font-medium">{request.accountManager}</p>
          </div>
          <div>
            <span className="text-gray-500">Module(s)</span>
            <p className="font-medium">{request.affectedModules.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary & Description */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Customer Request</h3>
            <p className="text-sm text-gray-600 italic border-l-4 border-gray-200 pl-3">
              "{request.description}"
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Summary</h3>
            <p className="text-sm text-gray-700">{request.summary}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Feature Tags</h3>
            <div className="flex flex-wrap gap-2">
              {request.featureTags.map((tag) => (
                <span
                  key={tag}
                  className="text-sm px-3 py-1 rounded-full bg-arcadis-light text-arcadis-dark font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Gap Analysis */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Baseline Reference</h3>
            <p className="text-sm text-gray-700">{request.baselineReference}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Roadmap Signal</h3>
            <p className="text-sm text-gray-700">{request.roadmapSignal}</p>
          </div>

          {request.followUpRequired && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="font-semibold text-amber-800 mb-2">Follow-Up Required</h3>
              <p className="text-sm text-amber-900">{request.followUpDetails}</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Requests */}
      {related.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Related Requests</h3>
          <div className="space-y-2">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/requests/${r.id}`}
                className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 border border-gray-100"
              >
                <div>
                  <span className="text-xs font-mono text-gray-400 mr-2">{r.id}</span>
                  <span className="text-sm font-medium text-gray-900">{r.title}</span>
                  <span className="text-xs text-gray-500 ml-2">({r.customer})</span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: GAP_COLORS[r.gapClassification] + '20',
                    color: GAP_COLORS[r.gapClassification],
                  }}
                >
                  {r.gapClassification}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
