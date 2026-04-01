import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  BookOpen,
  Zap,
  Workflow,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  type: 'component' | 'interactive' | 'workflow';
  description: string;
  intent: string;
  theme: string;
  best_for: string[];
  scenarios: string[];
  estimated_time: string;
  preview: string;
  path: string;
}

interface SkillsData {
  skills: Skill[];
}

const typeConfig = {
  component: {
    icon: BookOpen,
    label: 'Component',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    badge: 'bg-blue-50 border-blue-200',
  },
  interactive: {
    icon: Zap,
    label: 'Interactive',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    badge: 'bg-purple-50 border-purple-200',
  },
  workflow: {
    icon: Workflow,
    label: 'Workflow',
    color: 'bg-green-100 text-green-700 border-green-300',
    badge: 'bg-green-50 border-green-200',
  },
};

export default function PMSkillsDashboard() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetch('/skills-index.json');
        const data = (await response.json()) as SkillsData;
        setSkills(data.skills);
        setFilteredSkills(data.skills);
      } catch (error) {
        console.error('Failed to load skills:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, []);

  useEffect(() => {
    let filtered = skills;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((s) => s.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.intent.toLowerCase().includes(q) ||
          s.best_for.some((item) => item.toLowerCase().includes(q))
      );
    }

    setFilteredSkills(filtered);
  }, [searchQuery, selectedType, skills]);

  const stats = {
    component: skills.filter((s) => s.type === 'component').length,
    interactive: skills.filter((s) => s.type === 'interactive').length,
    workflow: skills.filter((s) => s.type === 'workflow').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">PM Skills Library</h2>
        <p className="mt-2 text-gray-600">
          Explore 46 product management skills to guide your work. Each skill includes
          frameworks, templates, and interactive guidance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Component Skills',
            count: stats.component,
            description: 'Templates & artifacts',
          },
          {
            label: 'Interactive Skills',
            count: stats.interactive,
            description: 'Guided discovery flows',
          },
          {
            label: 'Workflow Skills',
            count: stats.workflow,
            description: 'End-to-end processes',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stat.count}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search skills by name, description, or use case..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arcadis-green focus:border-transparent"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-arcadis-green text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={16} className="inline mr-2" />
            All Types
          </button>
          {Object.entries(typeConfig).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  selectedType === type
                    ? 'bg-arcadis-green text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon size={16} />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Skills Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-arcadis-green rounded-full" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const config = typeConfig[skill.type];
            const TypeIcon = config.icon;

            return (
              <div
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className="bg-white rounded-lg border border-gray-200 hover:border-arcadis-green hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              >
                <div className={`px-4 py-3 border-b ${config.badge}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TypeIcon size={18} className={config.color} />
                      <span className={`text-xs font-semibold px-2 py-1 rounded border ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    {skill.estimated_time && (
                      <span className="text-xs text-gray-600">{skill.estimated_time}</span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-gray-900">{skill.name}</h3>

                  <p className="text-sm text-gray-600 line-clamp-2">{skill.description}</p>

                  {skill.best_for.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Best For
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {skill.best_for.slice(0, 2).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-arcadis-green" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button className="text-arcadis-green hover:text-arcadis-dark font-semibold text-sm flex items-center gap-2 mt-3">
                    View Details <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredSkills.length === 0 && !loading && (
        <div className="text-center py-12">
          <Search size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">No skills found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSkill(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const config = typeConfig[selectedSkill.type];
                    const Icon = config.icon;
                    return (
                      <>
                        <Icon size={20} className={config.color} />
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded border ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </>
                    );
                  })()}
                  {selectedSkill.estimated_time && (
                    <span className="text-xs text-gray-600 ml-auto">
                      ⏱️ {selectedSkill.estimated_time}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedSkill.name}</h2>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Description
                </h3>
                <p className="text-gray-700">{selectedSkill.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Intent
                </h3>
                <p className="text-gray-700">{selectedSkill.intent}</p>
              </div>

              {selectedSkill.best_for.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                    Best For
                  </h3>
                  <ul className="space-y-2">
                    {selectedSkill.best_for.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <ChevronRight size={18} className="mt-0.5 flex-shrink-0 text-arcadis-green" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedSkill.scenarios.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                    When to Use
                  </h3>
                  <ul className="space-y-2">
                    {selectedSkill.scenarios.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-arcadis-green font-bold mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Next Step:</strong> Open the skill file to access the full framework,
                  templates, and examples.
                </p>
                <a
                  href={`https://github.com/ashenoynl030/TestEDA/tree/main${selectedSkill.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-arcadis-green text-white px-4 py-2 rounded-lg font-medium hover:bg-arcadis-dark transition-colors flex items-center gap-2"
                >
                  View Full Skill <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
