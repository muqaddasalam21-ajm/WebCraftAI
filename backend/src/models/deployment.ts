/**
 * Phase 14 — Deployment Model
 * Canonical types for website publishing & deployment records.
 */

export type DeploymentStatus =
  | 'READY_TO_PUBLISH'
  | 'DEPLOYING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'UNPUBLISHED';

export type DeploymentEnvironment =
  | 'production'
  | 'staging'
  | 'preview';

export type DomainVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'FAILED'
  | 'CONNECTED'
  | 'REMOVED';

/**
 * A single deployment attempt record.
 * Never overwritten — every attempt is a new record.
 */
export interface Deployment {
  id: string;
  projectId: string;
  websiteId: string;
  versionId: string;
  customerId: string;
  initiatedBy: string;       // user id who triggered deploy
  initiatedByName?: string;
  provider: string;          // 'netlify' | 'vercel' | 'webcraft_static' | 'none'
  providerDeploymentId?: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  deploymentUrl?: string;
  customDomain?: string;
  errorMessage?: string;
  buildArtifactPath?: string;
  publishedAt?: string;
  unpublishedAt?: string;
  unpublishedBy?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A custom domain record associated with a project.
 */
export interface DeploymentDomain {
  id: string;
  projectId: string;
  customerId: string;
  domain: string;             // e.g. 'www.mybusiness.com'
  verificationStatus: DomainVerificationStatus;
  providerDomainId?: string;
  dnsInstructions?: string;   // Provider-supplied DNS setup instructions
  verifiedAt?: string;
  connectedAt?: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeploymentInput {
  projectId: string;
  websiteId: string;
  versionId: string;
  customerId: string;
  initiatedBy: string;
  initiatedByName?: string;
  provider: string;
  environment?: DeploymentEnvironment;
}

export interface AddDomainInput {
  projectId: string;
  customerId: string;
  domain: string;
  addedBy: string;
}
