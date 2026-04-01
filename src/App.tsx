import { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import RequestList from './components/RequestList';
import RequestDetail from './components/RequestDetail';
import GapAnalysis from './components/GapAnalysis';
import RoadmapView from './components/RoadmapView';
import UploadAssess from './components/UploadAssess';
import PMSkillsDashboard from './components/PMSkillsDashboard';
import { sampleRequests } from './data/sampleRequests';
import { FeatureTag, GapClassification, AffectedModule, Priority } from './types';
import {
  LayoutDashboard,
  ListChecks,
  Search,
  Map,
  Upload,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filters, setFilters] = useState<{
    gap?: GapClassification;
    tag?: FeatureTag;
    module?: AffectedModule;
    priority?: Priority;
    search?: string;
  }>({});

  const filteredRequests = sampleRequests.filter((r) => {
    if (filters.gap && r.gapClassification !== filters.gap) return false;
    if (filters.tag && !r.featureTags.includes(filters.tag)) return false;
    if (filters.module && !r.affectedModules.includes(filters.module)) return false;
    if (filters.priority && r.priority !== filters.priority) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/requests', label: 'Requests', icon: ListChecks },
    { to: '/gap-analysis', label: 'Gap Analysis', icon: Search },
    { to: '/roadmap', label: 'Roadmap', icon: Map },
    { to: '/upload', label: 'Upload & Assess', icon: Upload },
    { to: '/pm-skills', label: 'PM Skills', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-arcadis-dark text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-arcadis-green rounded-md flex items-center justify-center text-white font-bold text-xs">
                EDA
              </div>
              <div>
                <h1 className="text-lg font-semibold">EDA Customer Request Tracker</h1>
                <p className="text-xs text-green-300">EDAP II Roadmap Intelligence</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-arcadis-green text-white'
                        : 'text-green-200 hover:bg-green-800 hover:text-white'
                    }`
                  }
                >
                  <link.icon size={16} />
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </nav>
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-green-800 pb-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-4 py-2 text-sm ${
                    isActive ? 'bg-arcadis-green text-white' : 'text-green-200'
                  }`
                }
              >
                <link.icon size={16} />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Dashboard requests={sampleRequests} />} />
          <Route
            path="/requests"
            element={
              <RequestList
                requests={filteredRequests}
                filters={filters}
                onFilterChange={setFilters}
                totalCount={sampleRequests.length}
              />
            }
          />
          <Route path="/requests/:id" element={<RequestDetail requests={sampleRequests} />} />
          <Route path="/gap-analysis" element={<GapAnalysis requests={sampleRequests} />} />
          <Route path="/roadmap" element={<RoadmapView requests={sampleRequests} />} />
          <Route path="/upload" element={<UploadAssess />} />
          <Route path="/pm-skills" element={<PMSkillsDashboard />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          Arcadis EDA Customer Request Tracker &mdash; Internal Use Only &mdash; Data sourced from SharePoint
        </div>
      </footer>
    </div>
  );
}
