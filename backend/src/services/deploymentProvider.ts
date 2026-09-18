/**
 * Phase 14 — Deployment Provider Abstraction
 *
 * Isolates provider-specific logic from business logic.
 * No real provider credentials are configured by default.
 * The ConfigurationRequiredProvider is the safe default — it will NOT pretend to succeed.
 *
 * To enable real deployment, set environment variables:
 *   DEPLOYMENT_PROVIDER=netlify|vercel|webcraft_static
 *   NETLIFY_API_TOKEN=<your-token>       (if using Netlify)
 *   NETLIFY_SITE_ID=<your-site-id>       (if using Netlify)
 *   VERCEL_TOKEN=<your-token>            (if using Vercel)
 *   VERCEL_TEAM_ID=<team-id>             (if using Vercel, optional)
 */

export interface WebsiteBuildArtifact {
  /** Absolute path to the built output directory */
  buildPath: string;
  /** Map of relative file paths to file contents */
  files: Record<string, string>;
  /** Total size in bytes */
  sizeBytes: number;
}

export interface ProviderDeployResult {
  providerDeploymentId: string;
  deploymentUrl?: string;
  status: 'DEPLOYING' | 'PUBLISHED' | 'FAILED';
  errorMessage?: string;
}

export interface ProviderStatusResult {
  status: 'DEPLOYING' | 'PUBLISHED' | 'FAILED';
  deploymentUrl?: string;
  errorMessage?: string;
}

export interface ProviderDomainResult {
  providerDomainId: string;
  dnsInstructions?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
}

/**
 * Abstract interface all providers must implement.
 */
export interface DeploymentProvider {
  readonly name: string;
  readonly isConfigured: boolean;

  /** Start a deployment. Returns immediately with initial status. */
  createDeployment(artifact: WebsiteBuildArtifact, deploymentId: string): Promise<ProviderDeployResult>;

  /** Poll for the current deployment status. */
  getDeploymentStatus(providerDeploymentId: string): Promise<ProviderStatusResult>;

  /** Get the live deployment URL (may be same as getDeploymentStatus result). */
  getDeploymentUrl(providerDeploymentId: string): Promise<string | undefined>;

  /** Cancel an in-progress deployment, if supported. */
  cancelDeployment?(providerDeploymentId: string): Promise<void>;

  /** Unpublish a live deployment, if supported. */
  unpublishDeployment?(providerDeploymentId: string): Promise<void>;

  /** Add a custom domain to a deployment. */
  addDomain?(providerDeploymentId: string, domain: string): Promise<ProviderDomainResult>;

  /** Remove a custom domain from a deployment. */
  removeDomain?(providerDomainId: string): Promise<void>;

  /** Get required configuration for this provider. */
  getConfigurationRequirements(): { variable: string; description: string; required: boolean }[];
}

// ---------------------------------------------------------------------------
// ConfigurationRequiredProvider
// Safe default: never pretends to succeed. Used when no provider is configured.
// ---------------------------------------------------------------------------
class ConfigurationRequiredProvider implements DeploymentProvider {
  readonly name = 'none';
  readonly isConfigured = false;

  async createDeployment(_artifact: WebsiteBuildArtifact, _deploymentId: string): Promise<ProviderDeployResult> {
    return {
      providerDeploymentId: `no-provider-${_deploymentId}`,
      status: 'FAILED',
      errorMessage: 'No deployment provider is configured. Set DEPLOYMENT_PROVIDER and the required credentials in your environment variables to enable publishing.'
    };
  }

  async getDeploymentStatus(_providerDeploymentId: string): Promise<ProviderStatusResult> {
    return { status: 'FAILED', errorMessage: 'No deployment provider configured.' };
  }

  async getDeploymentUrl(_providerDeploymentId: string): Promise<string | undefined> {
    return undefined;
  }

  getConfigurationRequirements() {
    return [
      { variable: 'DEPLOYMENT_PROVIDER', description: 'Deployment provider name: netlify | vercel | webcraft_static', required: true },
      { variable: 'NETLIFY_API_TOKEN', description: 'Netlify personal access token (required if DEPLOYMENT_PROVIDER=netlify)', required: false },
      { variable: 'NETLIFY_SITE_ID', description: 'Netlify site ID to deploy to (required if DEPLOYMENT_PROVIDER=netlify)', required: false },
      { variable: 'VERCEL_TOKEN', description: 'Vercel API token (required if DEPLOYMENT_PROVIDER=vercel)', required: false },
      { variable: 'VERCEL_TEAM_ID', description: 'Vercel team ID (optional, for team accounts)', required: false },
    ];
  }
}

// ---------------------------------------------------------------------------
// NetlifyProvider (real provider — requires NETLIFY_API_TOKEN + NETLIFY_SITE_ID)
// ---------------------------------------------------------------------------
class NetlifyProvider implements DeploymentProvider {
  readonly name = 'netlify';
  readonly isConfigured: boolean;
  private apiToken: string;
  private siteId: string;

  constructor() {
    this.apiToken = process.env.NETLIFY_API_TOKEN || '';
    this.siteId = process.env.NETLIFY_SITE_ID || '';
    this.isConfigured = Boolean(this.apiToken && this.siteId);
  }

  async createDeployment(artifact: WebsiteBuildArtifact, deploymentId: string): Promise<ProviderDeployResult> {
    if (!this.isConfigured) {
      return {
        providerDeploymentId: `netlify-unconfigured-${deploymentId}`,
        status: 'FAILED',
        errorMessage: 'Netlify provider selected but NETLIFY_API_TOKEN or NETLIFY_SITE_ID is not set.'
      };
    }

    try {
      // Build the file digest map for Netlify Deploy API
      const fileDigests: Record<string, string> = {};
      const crypto = await import('crypto');

      for (const [filePath, content] of Object.entries(artifact.files)) {
        const hash = crypto.createHash('sha1').update(content).digest('hex');
        fileDigests[`/${filePath}`] = hash;
      }

      // Step 1: Create deploy
      const createRes = await fetch(`https://api.netlify.com/api/v1/sites/${this.siteId}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: fileDigests })
      });

      if (!createRes.ok) {
        const body = await createRes.text();
        return {
          providerDeploymentId: `netlify-err-${deploymentId}`,
          status: 'FAILED',
          errorMessage: `Netlify API error (${createRes.status}): ${body.slice(0, 200)}`
        };
      }

      const deploy = await createRes.json() as { id: string; deploy_ssl_url?: string; url?: string; required?: string[] };

      // Step 2: Upload required files
      if (deploy.required && deploy.required.length > 0) {
        for (const [filePath, content] of Object.entries(artifact.files)) {
          const hash = crypto.createHash('sha1').update(content).digest('hex');
          if (deploy.required.includes(hash)) {
            await fetch(`https://api.netlify.com/api/v1/deploys/${deploy.id}/files/${encodeURIComponent(filePath)}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/octet-stream'
              },
              body: content
            });
          }
        }
      }

      return {
        providerDeploymentId: deploy.id,
        deploymentUrl: deploy.deploy_ssl_url || deploy.url,
        status: 'DEPLOYING'
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        providerDeploymentId: `netlify-err-${deploymentId}`,
        status: 'FAILED',
        errorMessage: `Netlify deployment failed: ${msg}`
      };
    }
  }

  async getDeploymentStatus(providerDeploymentId: string): Promise<ProviderStatusResult> {
    try {
      const res = await fetch(`https://api.netlify.com/api/v1/deploys/${providerDeploymentId}`, {
        headers: { 'Authorization': `Bearer ${this.apiToken}` }
      });

      if (!res.ok) {
        return { status: 'FAILED', errorMessage: `Netlify status check failed (${res.status})` };
      }

      const deploy = await res.json() as { state: string; deploy_ssl_url?: string; url?: string; error_message?: string };

      if (deploy.state === 'ready') {
        return { status: 'PUBLISHED', deploymentUrl: deploy.deploy_ssl_url || deploy.url };
      } else if (deploy.state === 'error') {
        return { status: 'FAILED', errorMessage: deploy.error_message || 'Netlify deployment error' };
      }

      return { status: 'DEPLOYING' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { status: 'FAILED', errorMessage: `Status check failed: ${msg}` };
    }
  }

  async getDeploymentUrl(providerDeploymentId: string): Promise<string | undefined> {
    const result = await this.getDeploymentStatus(providerDeploymentId);
    return result.deploymentUrl;
  }

  async unpublishDeployment(providerDeploymentId: string): Promise<void> {
    await fetch(`https://api.netlify.com/api/v1/deploys/${providerDeploymentId}/restore`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiToken}` }
    });
  }

  async addDomain(providerDeploymentId: string, domain: string): Promise<ProviderDomainResult> {
    const res = await fetch(`https://api.netlify.com/api/v1/sites/${this.siteId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ hostname: domain, type: 'CNAME', value: `${this.siteId}.netlify.app` })
    });

    if (!res.ok) {
      return { providerDomainId: '', verificationStatus: 'FAILED', dnsInstructions: 'Failed to add domain via Netlify API.' };
    }

    const record = await res.json() as { id?: string };
    return {
      providerDomainId: record.id || domain,
      verificationStatus: 'PENDING',
      dnsInstructions: `Add a CNAME record: ${domain} → ${this.siteId}.netlify.app. DNS propagation may take up to 48 hours.`
    };
  }

  async removeDomain(providerDomainId: string): Promise<void> {
    await fetch(`https://api.netlify.com/api/v1/sites/${this.siteId}/dns_records/${providerDomainId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.apiToken}` }
    });
  }

  getConfigurationRequirements() {
    return [
      { variable: 'NETLIFY_API_TOKEN', description: 'Netlify personal access token', required: true },
      { variable: 'NETLIFY_SITE_ID', description: 'Netlify site ID to deploy to', required: true },
    ];
  }
}

// ---------------------------------------------------------------------------
// Factory: resolve the correct provider based on env config
// ---------------------------------------------------------------------------
function createDeploymentProvider(): DeploymentProvider {
  const providerName = (process.env.DEPLOYMENT_PROVIDER || '').toLowerCase();

  if (providerName === 'netlify') {
    return new NetlifyProvider();
  }

  // More providers (Vercel, etc.) can be added here
  return new ConfigurationRequiredProvider();
}

export const deploymentProvider: DeploymentProvider = createDeploymentProvider();

export function getProviderConfigurationStatus(): {
  provider: string;
  isConfigured: boolean;
  requirements: { variable: string; description: string; required: boolean }[];
} {
  return {
    provider: deploymentProvider.name,
    isConfigured: deploymentProvider.isConfigured,
    requirements: deploymentProvider.getConfigurationRequirements()
  };
}
