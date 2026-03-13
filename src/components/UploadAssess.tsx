import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Trash2, Info, ClipboardPaste, Globe } from 'lucide-react';
import { UploadedDocument, DocumentAssessment, GapClassification } from '../types';
import { assessDocument } from '../data/baselineAssessor';
import SharePointBrowser from './SharePointBrowser';

const GAP_COLORS: Record<GapClassification, string> = {
  'No Gap': '#10B981',
  'Configuration Gap': '#3B82F6',
  'Partial Gap': '#F59E0B',
  'Feature Gap': '#EF4444',
  'Integration Gap': '#8B5CF6',
  'Unclear': '#6B7280',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  High: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-gray-100 text-gray-600',
};

const ACCEPTED_TYPES = [
  '.txt', '.csv', '.md', '.json', '.xml',
  '.pdf', '.doc', '.docx', '.rtf',
  '.xls', '.xlsx',
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type UploadTab = 'local' | 'sharepoint';

export default function UploadAssess() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [assessments, setAssessments] = useState<DocumentAssessment[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteName, setPasteName] = useState('');
  const [activeTab, setActiveTab] = useState<UploadTab>('local');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsText = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  const processFile = useCallback(async (file: File) => {
    const docId = `DOC-${String(documents.length + 1).padStart(3, '0')}`;
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isTextBased = ['txt', 'csv', 'md', 'json', 'xml', 'rtf'].includes(extension);

    const newDoc: UploadedDocument = {
      id: docId,
      fileName: file.name,
      fileType: extension,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      textContent: '',
      status: 'pending',
    };

    setDocuments(prev => [...prev, newDoc]);

    try {
      let textContent: string;

      if (isTextBased) {
        textContent = await readFileAsText(file);
      } else {
        // For binary formats (PDF, DOCX, XLS), we inform the user that
        // client-side parsing is limited and suggest pasting content
        textContent = '';
        setDocuments(prev =>
          prev.map(d =>
            d.id === docId
              ? {
                  ...d,
                  status: 'error' as const,
                  errorMessage: `Binary file format (.${extension}) detected. Client-side text extraction is limited for this format. Please use the "Paste Content" option to paste the document text, or convert to .txt/.csv first.`,
                }
              : d
          )
        );
        return;
      }

      if (textContent.trim().length < 10) {
        setDocuments(prev =>
          prev.map(d =>
            d.id === docId
              ? { ...d, status: 'error' as const, errorMessage: 'File appears to be empty or contains insufficient text for analysis.' }
              : d
          )
        );
        return;
      }

      // Update document with content and start assessment
      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? { ...d, textContent, status: 'assessing' as const }
            : d
        )
      );

      // Simulate brief processing delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));

      const assessment = assessDocument(docId, file.name, textContent);

      setAssessments(prev => [...prev, assessment]);
      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? { ...d, status: 'assessed' as const }
            : d
        )
      );
      setExpandedDoc(docId);
    } catch {
      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? { ...d, status: 'error' as const, errorMessage: 'Failed to read file contents.' }
            : d
        )
      );
    }
  }, [documents.length, readFileAsText]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      processFile(files[i]);
    }
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handlePasteSubmit = useCallback(async () => {
    if (!pasteText.trim()) return;

    const docId = `DOC-${String(documents.length + 1).padStart(3, '0')}`;
    const fileName = pasteName.trim() || `Pasted Content ${documents.length + 1}`;

    const newDoc: UploadedDocument = {
      id: docId,
      fileName,
      fileType: 'text',
      fileSize: new Blob([pasteText]).size,
      uploadedAt: new Date().toISOString(),
      textContent: pasteText,
      status: 'assessing',
    };

    setDocuments(prev => [...prev, newDoc]);
    setPasteMode(false);
    setPasteText('');
    setPasteName('');

    await new Promise(resolve => setTimeout(resolve, 800));

    const assessment = assessDocument(docId, fileName, pasteText);
    setAssessments(prev => [...prev, assessment]);
    setDocuments(prev =>
      prev.map(d =>
        d.id === docId ? { ...d, status: 'assessed' as const } : d
      )
    );
    setExpandedDoc(docId);
  }, [pasteText, pasteName, documents.length]);

  const removeDocument = useCallback((docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    setAssessments(prev => prev.filter(a => a.documentId !== docId));
    if (expandedDoc === docId) setExpandedDoc(null);
  }, [expandedDoc]);

  const handleSharePointFile = useCallback(async (
    fileName: string,
    fileSize: number,
    fileType: string,
    textContent: string,
  ) => {
    const docId = `SP-${String(documents.length + 1).padStart(3, '0')}`;

    const newDoc: UploadedDocument = {
      id: docId,
      fileName: `[SharePoint] ${fileName}`,
      fileType,
      fileSize,
      uploadedAt: new Date().toISOString(),
      textContent,
      status: 'assessing',
    };

    setDocuments(prev => [...prev, newDoc]);

    if (textContent.trim().length < 10) {
      setDocuments(prev =>
        prev.map(d =>
          d.id === docId
            ? { ...d, status: 'error' as const, errorMessage: 'Extracted text is too short for meaningful analysis.' }
            : d
        )
      );
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const assessment = assessDocument(docId, fileName, textContent);
    setAssessments(prev => [...prev, assessment]);
    setDocuments(prev =>
      prev.map(d =>
        d.id === docId ? { ...d, status: 'assessed' as const } : d
      )
    );
    setExpandedDoc(docId);
  }, [documents.length]);

  const getAssessment = (docId: string) => assessments.find(a => a.documentId === docId);

  // Aggregate stats across all assessments
  const aggregateStats = assessments.reduce(
    (acc, a) => {
      acc.total += a.summary.total;
      acc.featureGaps += a.summary.featureGapCount;
      for (const [gap, count] of Object.entries(a.summary.byGap)) {
        acc.byGap[gap] = (acc.byGap[gap] || 0) + count;
      }
      return acc;
    },
    { total: 0, featureGaps: 0, byGap: {} as Record<string, number> }
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Upload & Assess</h2>
        <p className="text-sm text-gray-500">
          Upload customer request documents, bid documents, or RFPs to automatically assess feature gaps against the EDAP II baseline.
        </p>
      </div>

      {/* Source Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'local'
                ? 'border-arcadis-green text-arcadis-dark'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload size={16} />
            Local Upload
          </button>
          <button
            onClick={() => setActiveTab('sharepoint')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sharepoint'
                ? 'border-arcadis-green text-arcadis-dark'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Globe size={16} />
            SharePoint
          </button>
        </div>

        <div className="p-6">
          {/* Local Upload Tab */}
          {activeTab === 'local' && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-arcadis-green bg-arcadis-light'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto mb-4 text-gray-400" size={40} />
                <p className="text-gray-700 font-medium mb-1">
                  Drag & drop files here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-arcadis-green hover:underline font-semibold"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Supported: TXT, CSV, MD, JSON, XML (text-based formats for best results)
                </p>
                <p className="text-xs text-gray-400">
                  PDF, DOCX, and XLS files will be accepted but require pasting text content manually.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES.join(',')}
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setPasteMode(!pasteMode)}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-arcadis-green transition-colors"
                  >
                    <ClipboardPaste size={16} />
                    Or paste document content directly
                  </button>
                </div>
              </div>

              {/* Paste Input */}
              {pasteMode && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-gray-800">Paste Document Content</h3>
                  <input
                    type="text"
                    value={pasteName}
                    onChange={(e) => setPasteName(e.target.value)}
                    placeholder="Document name (e.g., 'Thames Water RFP Q2 2026')"
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-arcadis-green"
                  />
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste the full document text here. The system will extract individual requirements and assess each against the EDAP II baseline..."
                    rows={10}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-arcadis-green resize-y font-mono"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {pasteText.length > 0 ? `${pasteText.length} characters` : ''}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setPasteMode(false); setPasteText(''); setPasteName(''); }}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePasteSubmit}
                        disabled={!pasteText.trim()}
                        className="px-4 py-2 text-sm bg-arcadis-green text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Assess Content
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SharePoint Tab */}
          {activeTab === 'sharepoint' && (
            <SharePointBrowser onFileExtracted={handleSharePointFile} />
          )}
        </div>
      </div>

      {/* Aggregate Stats (when there are assessments) */}
      {assessments.length > 0 && (
        <div className="bg-arcadis-light border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-arcadis-dark mb-2">Assessment Summary</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-600">Documents assessed:</span>{' '}
              <span className="font-semibold">{assessments.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Requirements found:</span>{' '}
              <span className="font-semibold">{aggregateStats.total}</span>
            </div>
            <div>
              <span className="text-gray-600">Feature gaps:</span>{' '}
              <span className="font-semibold text-red-600">{aggregateStats.featureGaps}</span>
            </div>
            {Object.entries(aggregateStats.byGap).map(([gap, count]) => (
              <div key={gap}>
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: GAP_COLORS[gap as GapClassification] || '#6B7280' }}
                />
                <span className="text-gray-600">{gap}:</span>{' '}
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Uploaded Documents</h3>
          {documents.map((doc) => {
            const assessment = getAssessment(doc.id);
            const isExpanded = expandedDoc === doc.id;

            return (
              <div key={doc.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Document Header */}
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileText size={20} className="text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{doc.fileName}</div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(doc.fileSize)} &middot; {new Date(doc.uploadedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {doc.status === 'pending' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Pending</span>
                    )}
                    {doc.status === 'assessing' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 animate-pulse">Assessing...</span>
                    )}
                    {doc.status === 'assessed' && assessment && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {assessment.summary.total} requirement{assessment.summary.total !== 1 ? 's' : ''} found
                      </span>
                    )}
                    {doc.status === 'error' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Error</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeDocument(doc.id); }}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Remove document"
                    >
                      <Trash2 size={16} />
                    </button>
                    {doc.status === 'assessed' && (
                      isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {doc.status === 'error' && doc.errorMessage && (
                  <div className="px-6 pb-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                      <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-700">{doc.errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* Expanded Assessment Results */}
                {isExpanded && assessment && (
                  <div className="border-t">
                    {/* Per-document gap summary bar */}
                    <div className="px-6 py-3 bg-gray-50 flex flex-wrap gap-3 text-xs">
                      {Object.entries(assessment.summary.byGap).map(([gap, count]) => (
                        <div key={gap} className="flex items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: GAP_COLORS[gap as GapClassification] || '#6B7280' }}
                          />
                          <span className="text-gray-600">{gap}:</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-1 ml-auto">
                        <Info size={12} className="text-gray-400" />
                        <span className="text-gray-400">
                          {assessment.summary.highConfidenceCount} high-confidence match{assessment.summary.highConfidenceCount !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Requirements list */}
                    <div className="divide-y">
                      {assessment.requirements.map((req) => (
                        <div key={req.id} className="px-6 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-gray-400">{req.id}</span>
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor: GAP_COLORS[req.gapClassification] + '20',
                                    color: GAP_COLORS[req.gapClassification],
                                  }}
                                >
                                  {req.gapClassification}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${CONFIDENCE_COLORS[req.confidence]}`}>
                                  {req.confidence} confidence
                                </span>
                              </div>

                              {/* Extracted text */}
                              <p className="text-sm text-gray-600 italic border-l-2 border-gray-200 pl-3 mb-2">
                                "{req.extractedText}"
                              </p>

                              {/* Assessment */}
                              <p className="text-sm text-gray-800 mb-2">{req.summary}</p>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1 mb-2">
                                {req.featureTags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-2 py-0.5 rounded-full bg-arcadis-light text-arcadis-dark"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {req.affectedModules.map((mod) => (
                                  <span
                                    key={mod}
                                    className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700"
                                  >
                                    {mod}
                                  </span>
                                ))}
                              </div>

                              {/* Baseline & Signal */}
                              <div className="text-xs space-y-1">
                                <div>
                                  <span className="text-gray-500">Baseline: </span>
                                  <span className="text-gray-700">{req.baselineReference}</span>
                                </div>
                                {req.roadmapSignal !== 'No action required' && (
                                  <div>
                                    <span className="text-gray-500">Signal: </span>
                                    <span className="text-arcadis-dark font-medium">{req.roadmapSignal}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0">
                              {req.gapClassification === 'No Gap' ? (
                                <CheckCircle size={20} className="text-green-500" />
                              ) : req.gapClassification === 'Unclear' ? (
                                <AlertCircle size={20} className="text-gray-400" />
                              ) : (
                                <AlertCircle size={20} style={{ color: GAP_COLORS[req.gapClassification] }} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {assessment.requirements.length === 0 && (
                        <div className="px-6 py-8 text-center text-gray-400">
                          No assessable requirements were extracted from this document.
                          The content may not contain recognizable feature requests or capability needs.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="font-semibold text-gray-800 mb-3">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-arcadis-light text-arcadis-green flex items-center justify-center font-bold">1</div>
              <h4 className="font-medium text-gray-900">Upload a document</h4>
              <p className="text-gray-600">
                Drop a customer RFP, bid document, requirements list, or feature request file. Text-based formats (TXT, CSV, MD) work best. You can also paste content directly.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-arcadis-light text-arcadis-green flex items-center justify-center font-bold">2</div>
              <h4 className="font-medium text-gray-900">Automatic extraction</h4>
              <p className="text-gray-600">
                The system extracts individual requirements from the document and matches each against the EDAP II baseline capability reference using keyword analysis.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-arcadis-light text-arcadis-green flex items-center justify-center font-bold">3</div>
              <h4 className="font-medium text-gray-900">Gap assessment</h4>
              <p className="text-gray-600">
                Each requirement is classified by gap type, mapped to the relevant EDAP II module, and tagged with a roadmap signal. Confidence levels indicate match quality.
              </p>
            </div>
          </div>
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
            <strong>Note:</strong> This automated assessment uses keyword matching against the EDAP II baseline.
            Results should be reviewed by the product team before being used for roadmap decisions.
            High-confidence matches are more reliable; low-confidence and unclear items require manual review.
          </div>
        </div>
      )}
    </div>
  );
}
