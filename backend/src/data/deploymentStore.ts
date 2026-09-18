/**
 * Phase 14 — Deployment Store
 * JSON-backed persistence for Deployment records.
 * Append-only for history — never overwrites historical records.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Deployment, DeploymentStatus, CreateDeploymentInput } from '../models/deployment';

const DATA_FILE = path.join(__dirname, '../../data/deployments.json');

function readAll(): Deployment[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(records: Deployment[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
}

class DeploymentStore {
  private records: Deployment[] = [];

  constructor() {
    this.records = readAll();
  }

  private persist(): void {
    writeAll(this.records);
  }

  create(input: CreateDeploymentInput): Deployment {
    const now = new Date().toISOString();
    const deployment: Deployment = {
      id: `dep_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      projectId: input.projectId,
      websiteId: input.websiteId,
      versionId: input.versionId,
      customerId: input.customerId,
      initiatedBy: input.initiatedBy,
      initiatedByName: input.initiatedByName,
      provider: input.provider,
      providerDeploymentId: undefined,
      environment: input.environment || 'production',
      status: 'READY_TO_PUBLISH',
      deploymentUrl: undefined,
      customDomain: undefined,
      errorMessage: undefined,
      buildArtifactPath: undefined,
      publishedAt: undefined,
      unpublishedAt: undefined,
      unpublishedBy: undefined,
      startedAt: now,
      completedAt: undefined,
      createdAt: now,
      updatedAt: now
    };

    this.records.push(deployment);
    this.persist();
    return deployment;
  }

  getById(id: string): Deployment | undefined {
    return this.records.find(d => d.id === id);
  }

  getByProjectId(projectId: string): Deployment[] {
    return this.records
      .filter(d => d.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /** Returns the latest non-failed deployment for a version (idempotency check) */
  getActiveByVersionId(versionId: string): Deployment | undefined {
    return this.records.find(
      d => d.versionId === versionId && (d.status === 'DEPLOYING' || d.status === 'PUBLISHED')
    );
  }

  /** Get the latest PUBLISHED deployment for a project */
  getPublishedByProjectId(projectId: string): Deployment | undefined {
    return this.records
      .filter(d => d.projectId === projectId && d.status === 'PUBLISHED')
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())[0];
  }

  update(id: string, partial: Partial<Omit<Deployment, 'id' | 'projectId' | 'customerId' | 'createdAt'>>): Deployment {
    const idx = this.records.findIndex(d => d.id === id);
    if (idx === -1) throw new Error(`Deployment ${id} not found.`);

    this.records[idx] = {
      ...this.records[idx],
      ...partial,
      updatedAt: new Date().toISOString()
    };

    this.persist();
    return this.records[idx];
  }

  setStatus(id: string, status: DeploymentStatus, extra?: Partial<Deployment>): Deployment {
    const now = new Date().toISOString();
    const update: Partial<Deployment> = { status, ...extra, updatedAt: now };

    if (status === 'PUBLISHED') update.publishedAt = now;
    if (status === 'DEPLOYING') update.startedAt = now;
    if (status === 'FAILED' || status === 'PUBLISHED' || status === 'UNPUBLISHED') update.completedAt = now;

    return this.update(id, update);
  }

  /** Check if customer owns this deployment */
  isOwnedBy(deploymentId: string, customerId: string): boolean {
    const dep = this.getById(deploymentId);
    return dep?.customerId === customerId;
  }

  getAll(): Deployment[] {
    return [...this.records];
  }
}

export const deploymentDb = new DeploymentStore();
