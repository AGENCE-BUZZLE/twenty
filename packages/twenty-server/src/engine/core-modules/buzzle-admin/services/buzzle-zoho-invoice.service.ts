import { Injectable, Logger } from '@nestjs/common';

import { BuzzleInvoiceDTO } from 'src/engine/core-modules/buzzle-admin/dtos/buzzle-invoice.dto';

// Workspace UUID -> Zoho customer_id map. Extended from env BUZZLE_ZOHO_MAP
// (JSON string of the same shape) at startup so ops can add clients without
// a redeploy. Pilot mapping is baked in.
const DEFAULT_MAP: Record<string, string> = {
  'e7b5e98e-af08-403e-a68e-b4da1b4864f1': '6606352000000129077', // Galaxy Glass
};

type TokenCacheEntry = { token: string; expiresAt: number };

@Injectable()
export class BuzzleZohoInvoiceService {
  private readonly logger = new Logger(BuzzleZohoInvoiceService.name);
  private cachedToken: TokenCacheEntry | null = null;
  private readonly workspaceMap: Record<string, string>;

  constructor() {
    this.workspaceMap = this.loadWorkspaceMap();
  }

  private loadWorkspaceMap(): Record<string, string> {
    const extra = process.env.BUZZLE_ZOHO_MAP;

    if (!extra) return { ...DEFAULT_MAP };

    try {
      const parsed = JSON.parse(extra);

      return { ...DEFAULT_MAP, ...parsed };
    } catch (err) {
      this.logger.warn(
        `BUZZLE_ZOHO_MAP is not valid JSON, ignoring: ${(err as Error).message}`,
      );

      return { ...DEFAULT_MAP };
    }
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (this.cachedToken && this.cachedToken.expiresAt > now + 60_000) {
      return this.cachedToken.token;
    }

    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const accountsHost = process.env.ZOHO_ACCOUNTS_HOST || 'accounts.zoho.com';

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Zoho credentials missing on server (ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN)');
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString();

    const res = await fetch(`https://${accountsHost}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const text = await res.text();

      throw new Error(`Zoho token refresh failed: ${res.status} ${text}`);
    }

    const json = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };

    const ttlMs = (json.expires_in ?? 3300) * 1000;

    this.cachedToken = {
      token: json.access_token,
      expiresAt: now + ttlMs,
    };

    return json.access_token;
  }

  async listInvoicesForWorkspace(
    workspaceId: string,
  ): Promise<BuzzleInvoiceDTO[]> {
    const zohoCustomerId = this.workspaceMap[workspaceId];

    if (!zohoCustomerId) {
      return [];
    }

    const orgId = process.env.ZOHO_ORGANIZATION_ID;
    const apiHost = process.env.ZOHO_API_HOST || 'www.zohoapis.com';

    if (!orgId) {
      throw new Error('ZOHO_ORGANIZATION_ID missing on server');
    }

    const token = await this.getAccessToken();

    const url = new URL(`https://${apiHost}/invoice/v3/invoices`);

    url.searchParams.set('organization_id', orgId);
    url.searchParams.set('customer_id', zohoCustomerId);
    url.searchParams.set('sort_column', 'date');
    url.searchParams.set('sort_order', 'D');
    url.searchParams.set('per_page', '100');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();

      throw new Error(`Zoho invoices fetch failed: ${res.status} ${text}`);
    }

    const json = (await res.json()) as {
      invoices?: Array<{
        invoice_id: string;
        invoice_number: string;
        date: string;
        due_date?: string;
        total: number;
        balance: number;
        currency_code: string;
        status: string;
      }>;
    };

    return (json.invoices ?? []).map((inv) => ({
      id: inv.invoice_id,
      number: inv.invoice_number,
      date: inv.date,
      dueDate: inv.due_date,
      total: inv.total,
      balance: inv.balance,
      currency: inv.currency_code,
      status: inv.status,
      downloadUrl: undefined,
    }));
  }

  // Streams the Zoho-generated PDF for a single invoice. The caller must
  // have already validated that the invoice belongs to the workspace
  // (via ownsInvoice) so no additional check is done here.
  async downloadInvoicePdf(
    invoiceId: string,
  ): Promise<{ buffer: Buffer; number: string }> {
    const orgId = process.env.ZOHO_ORGANIZATION_ID;
    const apiHost = process.env.ZOHO_API_HOST || 'www.zohoapis.com';

    if (!orgId) {
      throw new Error('ZOHO_ORGANIZATION_ID missing on server');
    }

    const token = await this.getAccessToken();

    // Fetch metadata first so we can name the file with the invoice number.
    const metaRes = await fetch(
      `https://${apiHost}/invoice/v3/invoices/${invoiceId}?organization_id=${orgId}`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } },
    );

    if (!metaRes.ok) {
      throw new Error(`Zoho invoice meta fetch failed: ${metaRes.status}`);
    }

    const meta = (await metaRes.json()) as {
      invoice?: { invoice_number?: string };
    };
    const number = meta.invoice?.invoice_number ?? invoiceId;

    const pdfRes = await fetch(
      `https://${apiHost}/invoice/v3/invoices/${invoiceId}?organization_id=${orgId}&accept=pdf`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } },
    );

    if (!pdfRes.ok) {
      throw new Error(`Zoho invoice pdf fetch failed: ${pdfRes.status}`);
    }

    const arrayBuffer = await pdfRes.arrayBuffer();

    return { buffer: Buffer.from(arrayBuffer), number };
  }

  async ownsInvoice(
    invoiceId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const zohoCustomerId = this.workspaceMap[workspaceId];

    if (!zohoCustomerId) return false;

    const orgId = process.env.ZOHO_ORGANIZATION_ID;
    const apiHost = process.env.ZOHO_API_HOST || 'www.zohoapis.com';

    if (!orgId) return false;

    const token = await this.getAccessToken();
    const res = await fetch(
      `https://${apiHost}/invoice/v3/invoices/${invoiceId}?organization_id=${orgId}`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } },
    );

    if (!res.ok) return false;

    const body = (await res.json()) as {
      invoice?: { customer_id?: string };
    };

    return body.invoice?.customer_id === zohoCustomerId;
  }
}
