/**
 * SharePoint service — calls the backend proxy at /api/sharepoint/*.
 * No Azure AD secrets exist in this file or anywhere in the frontend.
 * The backend handles all authentication with Microsoft Graph.
 */

const API_BASE = '/api';

export interface SharePointSite {
  id: string;
  name: string;
  webUrl: string;
  description: string;
}

export interface SharePointDrive {
  id: string;
  name: string;
  description: string;
  webUrl: string;
  driveType: string;
}

export interface SharePointItem {
  id: string;
  name: string;
  webUrl: string;
  size: number;
  lastModified: string;
  isFolder: boolean;
  mimeType: string | null;
  childCount?: number;
}

export interface ExtractedFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  textContent: string;
  extractedAt: string;
}

export interface HealthStatus {
  status: string;
  azureConfigured: boolean;
  timestamp: string;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function checkHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/health');
}

export async function searchSites(search: string): Promise<SharePointSite[]> {
  const data = await apiFetch<{ sites: SharePointSite[] }>(
    `/sharepoint/sites?search=${encodeURIComponent(search)}`
  );
  return data.sites;
}

export async function getSiteByPath(hostname: string, sitePath: string): Promise<SharePointSite> {
  return apiFetch<SharePointSite>(
    `/sharepoint/sites/by-path?hostname=${encodeURIComponent(hostname)}&sitePath=${encodeURIComponent(sitePath)}`
  );
}

export async function listDrives(siteId: string): Promise<SharePointDrive[]> {
  const data = await apiFetch<{ drives: SharePointDrive[] }>(
    `/sharepoint/sites/${encodeURIComponent(siteId)}/drives`
  );
  return data.drives;
}

export async function listItems(driveId: string, folderId?: string): Promise<SharePointItem[]> {
  const params = folderId ? `?folderId=${encodeURIComponent(folderId)}` : '';
  const data = await apiFetch<{ items: SharePointItem[] }>(
    `/sharepoint/drives/${encodeURIComponent(driveId)}/items${params}`
  );
  return data.items;
}

export async function searchFiles(driveId: string, query: string): Promise<SharePointItem[]> {
  const data = await apiFetch<{ items: SharePointItem[] }>(
    `/sharepoint/drives/${encodeURIComponent(driveId)}/search?q=${encodeURIComponent(query)}`
  );
  return data.items;
}

export async function extractFileContent(driveId: string, itemId: string): Promise<ExtractedFile> {
  return apiFetch<ExtractedFile>(
    `/sharepoint/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/extract`
  );
}

/**
 * Check if a file extension is supported for text extraction.
 */
export function isSupportedFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['pptx', 'xlsx', 'xls', 'csv', 'txt', 'md', 'json', 'xml'].includes(ext);
}

/**
 * Get a human-readable label for a file type.
 */
export function fileTypeLabel(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const labels: Record<string, string> = {
    pptx: 'PowerPoint',
    xlsx: 'Excel',
    xls: 'Excel (Legacy)',
    csv: 'CSV',
    txt: 'Text',
    md: 'Markdown',
    json: 'JSON',
    xml: 'XML',
    pdf: 'PDF (not supported)',
    docx: 'Word (not supported)',
  };
  return labels[ext] || ext.toUpperCase();
}
