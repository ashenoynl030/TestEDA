import { useState, useCallback, useEffect } from 'react';
import {
  Search,
  Folder,
  FileSpreadsheet,
  Presentation,
  FileText,
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Download,
  CheckCircle2,
  HardDrive,
  Globe,
  RefreshCw,
  Shield,
} from 'lucide-react';
import {
  checkHealth,
  searchSites,
  listDrives,
  listItems,
  extractFileContent,
  isSupportedFile,
  fileTypeLabel,
  type SharePointSite,
  type SharePointDrive,
  type SharePointItem,
  type HealthStatus,
} from '../services/sharepointService';

interface Props {
  onFileExtracted: (fileName: string, fileSize: number, fileType: string, textContent: string) => void;
}

type BrowseStep = 'health' | 'sites' | 'drives' | 'files';

interface BreadcrumbItem {
  label: string;
  step: BrowseStep;
  id?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(item: SharePointItem) {
  if (item.isFolder) return <Folder size={18} className="text-yellow-500" />;
  const ext = item.name.split('.').pop()?.toLowerCase();
  if (ext === 'pptx' || ext === 'ppt') return <Presentation size={18} className="text-orange-500" />;
  if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet size={18} className="text-green-600" />;
  return <FileText size={18} className="text-gray-400" />;
}

export default function SharePointBrowser({ onFileExtracted }: Props) {
  const [step, setStep] = useState<BrowseStep>('health');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [sites, setSites] = useState<SharePointSite[]>([]);
  const [drives, setDrives] = useState<SharePointDrive[]>([]);
  const [items, setItems] = useState<SharePointItem[]>([]);
  const [selectedSite, setSelectedSite] = useState<SharePointSite | null>(null);
  const [selectedDrive, setSelectedDrive] = useState<SharePointDrive | null>(null);
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [extractedIds, setExtractedIds] = useState<Set<string>>(new Set());

  // Check backend health on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const h = await checkHealth();
        setHealth(h);
        if (h.azureConfigured) {
          setStep('sites');
        }
      } catch {
        setError('Cannot reach the backend server. Make sure the server is running on port 3001.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearchSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchSites(searchQuery);
      setSites(results);
      setStep('sites');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search sites');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const handleSelectSite = useCallback(async (site: SharePointSite) => {
    setLoading(true);
    setError(null);
    setSelectedSite(site);
    try {
      const driveList = await listDrives(site.id);
      setDrives(driveList);
      setStep('drives');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list drives');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectDrive = useCallback(async (drive: SharePointDrive) => {
    setLoading(true);
    setError(null);
    setSelectedDrive(drive);
    setFolderStack([]);
    try {
      const fileList = await listItems(drive.id);
      setItems(fileList);
      setStep('files');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list files');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenFolder = useCallback(async (folder: SharePointItem) => {
    if (!selectedDrive) return;
    setLoading(true);
    setError(null);
    try {
      const fileList = await listItems(selectedDrive.id, folder.id);
      setItems(fileList);
      setFolderStack(prev => [...prev, { id: folder.id, name: folder.name }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open folder');
    } finally {
      setLoading(false);
    }
  }, [selectedDrive]);

  const handleGoBack = useCallback(async () => {
    if (!selectedDrive) return;

    if (folderStack.length > 1) {
      // Go to parent folder
      const newStack = folderStack.slice(0, -1);
      const parentId = newStack[newStack.length - 1].id;
      setLoading(true);
      setError(null);
      try {
        const fileList = await listItems(selectedDrive.id, parentId);
        setItems(fileList);
        setFolderStack(newStack);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to navigate');
      } finally {
        setLoading(false);
      }
    } else if (folderStack.length === 1) {
      // Go to drive root
      setLoading(true);
      setError(null);
      try {
        const fileList = await listItems(selectedDrive.id);
        setItems(fileList);
        setFolderStack([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to navigate');
      } finally {
        setLoading(false);
      }
    } else {
      // Go back to drives
      setStep('drives');
      setSelectedDrive(null);
    }
  }, [selectedDrive, folderStack]);

  const handleExtractFile = useCallback(async (item: SharePointItem) => {
    if (!selectedDrive) return;
    setExtractingId(item.id);
    setError(null);
    try {
      const extracted = await extractFileContent(selectedDrive.id, item.id);
      onFileExtracted(extracted.fileName, extracted.fileSize, extracted.fileType, extracted.textContent);
      setExtractedIds(prev => new Set(prev).add(item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract file');
    } finally {
      setExtractingId(null);
    }
  }, [selectedDrive, onFileExtracted]);

  // Build breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Sites', step: 'sites' }];
  if (selectedSite) {
    breadcrumbs.push({ label: selectedSite.name, step: 'drives', id: selectedSite.id });
  }
  if (selectedDrive) {
    breadcrumbs.push({ label: selectedDrive.name, step: 'files', id: selectedDrive.id });
  }
  for (const folder of folderStack) {
    breadcrumbs.push({ label: folder.name, step: 'files', id: folder.id });
  }

  // Not configured state
  if (step === 'health' && health && !health.azureConfigured) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Shield size={24} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800 mb-2">SharePoint Integration Not Configured</h4>
            <p className="text-sm text-amber-700 mb-3">
              The backend server is running but Azure AD credentials are not configured.
              To connect to your SharePoint knowledge base:
            </p>
            <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1 mb-3">
              <li>Register an app in Azure Portal → App registrations</li>
              <li>Add <strong>Sites.Read.All</strong> and <strong>Files.Read.All</strong> application permissions</li>
              <li>Create a client secret</li>
              <li>Copy <code className="bg-amber-100 px-1 rounded">server/.env.example</code> → <code className="bg-amber-100 px-1 rounded">server/.env</code></li>
              <li>Fill in AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET</li>
              <li>Restart the backend server</li>
            </ol>
            <button
              onClick={() => { setStep('health'); setHealth(null); setError(null); window.location.reload(); }}
              className="inline-flex items-center gap-1 text-sm text-amber-800 hover:text-amber-900 font-medium"
            >
              <RefreshCw size={14} />
              Retry connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Connection error state
  if (step === 'health' && error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800 mb-2">Backend Server Unreachable</h4>
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <div className="bg-red-100 rounded-md p-3 text-xs text-red-800 font-mono mb-3">
              cd server && npm install && npm run dev
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1 text-sm text-red-800 hover:text-red-900 font-medium"
            >
              <RefreshCw size={14} />
              Retry connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
        <Globe size={14} />
        {breadcrumbs.map((bc, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} />}
            <button
              onClick={() => {
                if (bc.step === 'sites') {
                  setStep('sites');
                  setSelectedSite(null);
                  setSelectedDrive(null);
                  setFolderStack([]);
                } else if (bc.step === 'drives' && selectedSite) {
                  handleSelectSite(selectedSite);
                }
              }}
              className={`hover:text-arcadis-green ${i === breadcrumbs.length - 1 ? 'text-gray-800 font-medium' : ''}`}
            >
              {bc.label}
            </button>
          </span>
        ))}
      </div>

      {/* Error banner */}
      {error && step !== 'health' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Sites view — search + list */}
      {step === 'sites' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSites()}
                placeholder="Search SharePoint sites (e.g. 'EDA Knowledge Base')"
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-arcadis-green"
              />
            </div>
            <button
              onClick={handleSearchSites}
              disabled={loading}
              className="px-4 py-2 bg-arcadis-green text-white text-sm rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
            </button>
          </div>

          {sites.length > 0 && (
            <div className="divide-y border rounded-md">
              {sites.map(site => (
                <button
                  key={site.id}
                  onClick={() => handleSelectSite(site)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Globe size={18} className="text-blue-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{site.name}</div>
                    {site.description && (
                      <div className="text-xs text-gray-500 truncate">{site.description}</div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {sites.length === 0 && !loading && searchQuery && (
            <p className="text-sm text-gray-500 text-center py-4">No sites found. Try a different search term.</p>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Drives view */}
      {step === 'drives' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => { setStep('sites'); setSelectedSite(null); }} className="text-sm text-gray-500 hover:text-arcadis-green flex items-center gap-1">
              <ArrowLeft size={14} /> Back to sites
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : drives.length > 0 ? (
            <div className="divide-y border rounded-md">
              {drives.map(drive => (
                <button
                  key={drive.id}
                  onClick={() => handleSelectDrive(drive)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                >
                  <HardDrive size={18} className="text-purple-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{drive.name}</div>
                    {drive.description && (
                      <div className="text-xs text-gray-500 truncate">{drive.description}</div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No document libraries found on this site.</p>
          )}
        </div>
      )}

      {/* Files view */}
      {step === 'files' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleGoBack}
              className="text-sm text-gray-500 hover:text-arcadis-green flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="text-xs text-gray-400">
              {items.filter(i => !i.isFolder && isSupportedFile(i.name)).length} supported files
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : items.length > 0 ? (
            <div className="divide-y border rounded-md">
              {/* Folders first, then files */}
              {items
                .sort((a, b) => {
                  if (a.isFolder && !b.isFolder) return -1;
                  if (!a.isFolder && b.isFolder) return 1;
                  return a.name.localeCompare(b.name);
                })
                .map(item => {
                  const supported = !item.isFolder && isSupportedFile(item.name);
                  const isExtracting = extractingId === item.id;
                  const wasExtracted = extractedIds.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`px-4 py-3 flex items-center gap-3 ${
                        item.isFolder ? 'hover:bg-gray-50 cursor-pointer' : ''
                      }`}
                      onClick={() => item.isFolder && handleOpenFolder(item)}
                    >
                      {getFileIcon(item)}
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm truncate ${supported || item.isFolder ? 'text-gray-900' : 'text-gray-400'}`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.isFolder
                            ? `${item.childCount ?? '—'} items`
                            : `${formatFileSize(item.size)} · ${fileTypeLabel(item.name)} · ${new Date(item.lastModified).toLocaleDateString()}`
                          }
                        </div>
                      </div>

                      {item.isFolder ? (
                        <ChevronRight size={16} className="text-gray-400" />
                      ) : wasExtracted ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 size={14} /> Imported
                        </span>
                      ) : supported ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleExtractFile(item); }}
                          disabled={isExtracting}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-arcadis-green text-white hover:bg-green-600 disabled:opacity-50"
                        >
                          {isExtracting ? (
                            <><Loader2 size={12} className="animate-spin" /> Extracting...</>
                          ) : (
                            <><Download size={12} /> Import & Assess</>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Unsupported</span>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">This folder is empty.</p>
          )}
        </div>
      )}
    </div>
  );
}
