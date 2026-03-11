import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  FileText,
} from 'lucide-react';
import { CustomerRequest, GapClassification } from '../types';

const GAP_COLORS: Record<GapClassification, string> = {
  'No Gap': '#10B981',
  'Configuration Gap': '#3B82F6',
  'Partial Gap': '#F59E0B',
  'Feature Gap': '#EF4444',
  'Integration Gap': '#8B5CF6',
  'Unclear': '#6B7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#DC2626',
  High: '#F97316',
  Medium: '#EAB308',
  Low: '#22C55E',
  'Not Set': '#9CA3AF',
};

interface Props {
  requests: CustomerRequest[];
}

export default function Dashboard({ requests }: Props) {
  const stats = useMemo(() => {
    const byGap: Record<string, number> = {};
    const byTag: Record<string, number> = {};
    const byModule: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byCustomer: Record<string, number> = {};
    let followUpCount = 0;

    for (const r of requests) {
      byGap[r.gapClassification] = (byGap[r.gapClassification] || 0) + 1;
      byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
      byCustomer[r.customer] = (byCustomer[r.customer] || 0) + 1;
      if (r.followUpRequired) followUpCount++;
      for (const tag of r.featureTags) {
        byTag[tag] = (byTag[tag] || 0) + 1;
      }
      for (const mod of r.affectedModules) {
        byModule[mod] = (byModule[mod] || 0) + 1;
      }
    }

    return { byGap, byTag, byModule, byPriority, byCustomer, followUpCount };
  }, [requests]);

  const gapData = Object.entries(stats.byGap).map(([name, value]) => ({ name, value }));
  const tagData = Object.entries(stats.byTag)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  const moduleData = Object.entries(stats.byModule).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(stats.byPriority).map(([name, value]) => ({ name, value }));

  const featureGapCount = stats.byGap['Feature Gap'] || 0;
  const criticalCount = stats.byPriority['Critical'] || 0;

  // Identify cross-customer patterns
  const patterns = useMemo(() => {
    const tagCustomers: Record<string, Set<string>> = {};
    for (const r of requests) {
      if (r.gapClassification === 'Feature Gap' || r.gapClassification === 'Partial Gap') {
        for (const tag of r.featureTags) {
          if (!tagCustomers[tag]) tagCustomers[tag] = new Set();
          tagCustomers[tag].add(r.customer);
        }
      }
    }
    return Object.entries(tagCustomers)
      .filter(([, customers]) => customers.size >= 2)
      .sort((a, b) => b[1].size - a[1].size)
      .map(([tag, customers]) => ({ tag, customerCount: customers.size, customers: [...customers] }));
  }, [requests]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">
            Overview of {requests.length} customer requests across the EDA platform
          </p>
        </div>
        <span className="text-sm text-gray-400">Last refreshed: {new Date().toLocaleDateString()}</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={FileText} label="Total Requests" value={requests.length} color="text-arcadis-dark" />
        <KpiCard icon={AlertTriangle} label="Feature Gaps" value={featureGapCount} color="text-red-500" />
        <KpiCard icon={TrendingUp} label="Critical Priority" value={criticalCount} color="text-red-600" />
        <KpiCard icon={Clock} label="Follow-Up Needed" value={stats.followUpCount} color="text-amber-500" />
        <KpiCard icon={Users} label="Customers" value={Object.keys(stats.byCustomer).length} color="text-blue-600" />
        <KpiCard icon={CheckCircle} label="No Gap" value={stats.byGap['No Gap'] || 0} color="text-green-600" />
      </div>

      {/* Strategic Patterns Alert */}
      {patterns.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2">
            <TrendingUp size={18} />
            Cross-Customer Strategic Patterns Detected
          </h3>
          <div className="mt-2 space-y-2">
            {patterns.map((p) => (
              <div key={p.tag} className="text-sm text-amber-900">
                <span className="font-medium">{p.tag}</span> — requested by{' '}
                <span className="font-medium">{p.customerCount} customers</span> (
                {p.customers.join(', ')})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gap Classification Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Gap Classification Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={gapData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {gapData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={GAP_COLORS[entry.name as GapClassification] || '#6B7280'}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Tags */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Requests by Feature Tag</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tagData} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="value" fill="#00AA55" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {priorityData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={PRIORITY_COLORS[entry.name] || '#9CA3AF'}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Affected Modules */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Requests by Affected Module</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={moduleData} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#0066CC" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Requests Quick View */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Recent Requests</h3>
          <Link to="/requests" className="text-sm text-arcadis-green hover:underline">
            View all &rarr;
          </Link>
        </div>
        <div className="space-y-3">
          {requests.slice(-5).reverse().map((r) => (
            <Link
              key={r.id}
              to={`/requests/${r.id}`}
              className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">{r.id}</span>
                  <span className="font-medium text-gray-900 truncate">{r.title}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {r.customer} &middot; {r.submissionDate}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
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
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className={`${color} mb-2`}>
        <Icon size={20} />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
