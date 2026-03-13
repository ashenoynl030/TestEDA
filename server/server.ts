import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { extractTextFromPptx, extractTextFromXlsx } from './fileParsers.js';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));

// ---------------------------------------------------------------------------
// Azure AD Configuration — all secrets stay server-side
// ---------------------------------------------------------------------------
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;

if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
  console.warn(
    '⚠  Missing Azure AD env vars (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET).\n' +
    '   SharePoint endpoints will return 503 until configured.\n' +
    '   Copy .env.example → .env and fill in your values.'
  );
}

// MSAL confidential client — uses client_credentials flow (app-only, no user sign-in)
const msalClient = (TENANT_ID && CLIENT_ID && CLIENT_SECRET)
  ? new ConfidentialClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: `https://login.microsoftonline.com/${TENANT_ID}`,
        clientSecret: CLIENT_SECRET,
      },
    })
  : null;

/**
 * Acquire an app-only access token for Microsoft Graph.
 */
async function getGraphToken(): Promise<string> {
  if (!msalClient) throw new Error('Azure AD not configured');

  const result = await msalClient.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });

  if (!result?.accessToken) throw new Error('Failed to acquire Graph token');
  return result.accessToken;
}

/**
 * Make an authenticated GET request to Microsoft Graph.
 */
async function graphGet(path: string): Promise<Response> {
  const token = await getGraphToken();
  return fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Make an authenticated GET request and return the raw buffer (for file downloads).
 */
async function graphGetBuffer(path: string): Promise<ArrayBuffer> {
  const token = await getGraphToken();
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API error ${res.status}: ${text}`);
  }
  return res.arrayBuffer();
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    azureConfigured: !!msalClient,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// SharePoint: Search sites
// ---------------------------------------------------------------------------
app.get('/api/sharepoint/sites', async (req, res) => {
  try {
    const search = req.query.search as string || '';
    const path = search
      ? `/sites?search=${encodeURIComponent(search)}&$top=20`
      : '/sites?$top=20';

    const graphRes = await graphGet(path);
    if (!graphRes.ok) {
      const err = await graphRes.text();
      res.status(graphRes.status).json({ error: err });
      return;
    }

    const data = await graphRes.json();
    const sites = (data.value || []).map((s: Record<string, unknown>) => ({
      id: s.id,
      name: s.displayName || s.name,
      webUrl: s.webUrl,
      description: s.description,
    }));

    res.json({ sites });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(503).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// SharePoint: Get a specific site by hostname and path
// ---------------------------------------------------------------------------
app.get('/api/sharepoint/sites/by-path', async (req, res) => {
  try {
    const hostname = req.query.hostname as string;
    const sitePath = req.query.sitePath as string;

    if (!hostname || !sitePath) {
      res.status(400).json({ error: 'hostname and sitePath query params required' });
      return;
    }

    const graphRes = await graphGet(`/sites/${hostname}:${sitePath}`);
    if (!graphRes.ok) {
      const err = await graphRes.text();
      res.status(graphRes.status).json({ error: err });
      return;
    }

    const site = await graphRes.json();
    res.json({
      id: site.id,
      name: site.displayName || site.name,
      webUrl: site.webUrl,
      description: site.description,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(503).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// SharePoint: List drives (document libraries) for a site
// ---------------------------------------------------------------------------
app.get('/api/sharepoint/sites/:siteId/drives', async (req, res) => {
  try {
    const graphRes = await graphGet(`/sites/${req.params.siteId}/drives`);
    if (!graphRes.ok) {
      const err = await graphRes.text();
      res.status(graphRes.status).json({ error: err });
      return;
    }

    const data = await graphRes.json();
    const drives = (data.value || []).map((d: Record<string, unknown>) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      webUrl: d.webUrl,
      driveType: d.driveType,
    }));

    res.json({ drives });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(503).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// SharePoint: List items in a drive folder
// ---------------------------------------------------------------------------
app.get('/api/sharepoint/drives/:driveId/items', async (req, res) => {
  try {
    const folderId = req.query.folderId as string;
    const path = folderId
      ? `/drives/${req.params.driveId}/items/${folderId}/children?$top=100`
      : `/drives/${req.params.driveId}/root/children?$top=100`;

    const graphRes = await graphGet(path);
    if (!graphRes.ok) {
      const err = await graphRes.text();
      res.status(graphRes.status).json({ error: err });
      return;
    }

    const data = await graphRes.json();
    const items = (data.value || []).map((item: Record<string, unknown>) => {
      const file = item.file as Record<string, unknown> | undefined;
      const folder = item.folder as Record<string, unknown> | undefined;
      return {
        id: item.id,
        name: item.name,
        webUrl: item.webUrl,
        size: item.size,
        lastModified: (item.lastModifiedDateTime as string) || '',
        isFolder: !!folder,
        mimeType: file?.mimeType || null,
        childCount: folder ? (folder.childCount as number) : undefined,
      };
    });

    res.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(503).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// SharePoint: Search files within a drive
// ---------------------------------------------------------------------------
app.get('/api/sharepoint/drives/:driveId/search', async (req, res) => {
  try {
    const query = req.query.q as string || '';
    if (!query) {
      res.status(400).json({ error: 'q query param required' });
      return;
    }

    const graphRes = await graphGet(
      `/drives/${req.params.driveId}/root/search(q='${encodeURIComponent(query)}')?$top=50`
    );
    if (!graphRes.ok) {
      const err = await graphRes.text();
      res.status(graphRes.status).json({ error: err });
      return;
    }

    const data = await graphRes.json();
    const items = (data.value || []).map((item: Record<string, unknown>) => {
      const file = item.file as Record<string, unknown> | undefined;
      return {
        id: item.id,
        name: item.name,
        webUrl: item.webUrl,
        size: item.size,
        lastModified: (item.lastModifiedDateTime as string) || '',
        isFolder: !file,
        mimeType: file?.mimeType || null,
      };
    });

    res.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(503).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// SharePoint: Download a file and extract text content
// This is the key endpoint — binary parsing happens server-side,
// only extracted text is sent to the browser.
// ---------------------------------------------------------------------------
app.get('/api/sharepoint/drives/:driveId/items/:itemId/extract', async (req, res) => {
  try {
    // First get file metadata
    const metaRes = await graphGet(`/drives/${req.params.driveId}/items/${req.params.itemId}`);
    if (!metaRes.ok) {
      const err = await metaRes.text();
      res.status(metaRes.status).json({ error: err });
      return;
    }
    const meta = await metaRes.json();
    const fileName = (meta.name as string) || 'unknown';
    const fileSize = (meta.size as number) || 0;
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    // Download file content
    const buffer = await graphGetBuffer(
      `/drives/${req.params.driveId}/items/${req.params.itemId}/content`
    );

    // Extract text based on file type
    let textContent: string;

    switch (extension) {
      case 'pptx':
        textContent = await extractTextFromPptx(Buffer.from(buffer));
        break;
      case 'xlsx':
      case 'xls':
        textContent = extractTextFromXlsx(Buffer.from(buffer));
        break;
      case 'csv':
      case 'txt':
      case 'md':
      case 'json':
      case 'xml':
        textContent = new TextDecoder('utf-8').decode(buffer);
        break;
      default:
        // For unsupported types, try reading as UTF-8
        textContent = new TextDecoder('utf-8').decode(buffer);
        break;
    }

    res.json({
      fileName,
      fileSize,
      fileType: extension,
      textContent,
      extractedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(503).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || '3001', 10);
app.listen(PORT, () => {
  console.log(`\n  EDA Tracker API server running on http://localhost:${PORT}`);
  console.log(`  Azure AD configured: ${!!msalClient}`);
  console.log(`  CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}\n`);
});
