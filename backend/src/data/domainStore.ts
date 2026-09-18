/**
 * Phase 14 — Domain Store
 * JSON-backed persistence for custom domain records.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DeploymentDomain, DomainVerificationStatus, AddDomainInput } from '../models/deployment';

const DATA_FILE = path.join(__dirname, '../../data/deployment-domains.json');

function readAll(): DeploymentDomain[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(records: DeploymentDomain[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
}

class DomainStore {
  private records: DeploymentDomain[] = [];

  constructor() {
    this.records = readAll();
  }

  private persist(): void {
    writeAll(this.records);
  }

  create(input: AddDomainInput): DeploymentDomain {
    const now = new Date().toISOString();

    // Normalize domain
    const domain = input.domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    const record: DeploymentDomain = {
      id: `dom_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      projectId: input.projectId,
      customerId: input.customerId,
      domain,
      verificationStatus: 'PENDING',
      providerDomainId: undefined,
      dnsInstructions: undefined,
      verifiedAt: undefined,
      connectedAt: undefined,
      addedBy: input.addedBy,
      createdAt: now,
      updatedAt: now
    };

    this.records.push(record);
    this.persist();
    return record;
  }

  getById(id: string): DeploymentDomain | undefined {
    return this.records.find(d => d.id === id);
  }

  getByProjectId(projectId: string): DeploymentDomain[] {
    return this.records
      .filter(d => d.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  update(id: string, partial: Partial<Omit<DeploymentDomain, 'id' | 'projectId' | 'customerId' | 'createdAt'>>): DeploymentDomain {
    const idx = this.records.findIndex(d => d.id === id);
    if (idx === -1) throw new Error(`Domain ${id} not found.`);

    this.records[idx] = {
      ...this.records[idx],
      ...partial,
      updatedAt: new Date().toISOString()
    };

    this.persist();
    return this.records[idx];
  }

  setStatus(id: string, status: DomainVerificationStatus, extra?: Partial<DeploymentDomain>): DeploymentDomain {
    const now = new Date().toISOString();
    const update: Partial<DeploymentDomain> = { verificationStatus: status, ...extra };
    if (status === 'VERIFIED') update.verifiedAt = now;
    if (status === 'CONNECTED') update.connectedAt = now;
    return this.update(id, update);
  }

  delete(id: string): boolean {
    const idx = this.records.findIndex(d => d.id === id);
    if (idx === -1) return false;
    this.records.splice(idx, 1);
    this.persist();
    return true;
  }

  isOwnedBy(domainId: string, customerId: string): boolean {
    const dom = this.getById(domainId);
    return dom?.customerId === customerId;
  }
}

export const domainDb = new DomainStore();
