import fs from 'fs';
import path from 'path';
import { WebsiteSpecification, validateWebsiteSpecification } from '../models/websiteSpecificationSchema';

const AI_WEBSITES_FILE = path.join(__dirname, '../../data/ai-websites.json');
const AI_WEBSITE_VERSIONS_FILE = path.join(__dirname, '../../data/ai-website-versions.json');

function ensureFileExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
  }
}

export interface WebsiteVersionSnapshot {
  websiteId: string;
  version: number;
  specification: WebsiteSpecification;
  savedAt: string;
  savedBy: string;
  changeNote?: string;
}

class AiWebsiteDatabase {
  private websites: Map<string, WebsiteSpecification> = new Map();
  private versions: WebsiteVersionSnapshot[] = [];

  constructor() {
    this.load();
  }

  private load() {
    ensureFileExists(AI_WEBSITES_FILE);
    ensureFileExists(AI_WEBSITE_VERSIONS_FILE);
    try {
      const raw = fs.readFileSync(AI_WEBSITES_FILE, 'utf-8');
      const list: any[] = JSON.parse(raw);
      this.websites.clear();
      list.forEach(w => {
        const normalized = this.normalizeRecord(w);
        this.websites.set(normalized.id, normalized);
      });
    } catch (e) {
      console.error('Error reading ai-websites.json:', e);
      this.websites.clear();
    }

    try {
      const rawVers = fs.readFileSync(AI_WEBSITE_VERSIONS_FILE, 'utf-8');
      this.versions = JSON.parse(rawVers);
    } catch (e) {
      console.error('Error reading ai-website-versions.json:', e);
      this.versions = [];
    }
  }

  private saveWebsites() {
    try {
      const list = Array.from(this.websites.values());
      fs.writeFileSync(AI_WEBSITES_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving ai-websites.json:', e);
    }
  }

  private saveVersions() {
    try {
      fs.writeFileSync(AI_WEBSITE_VERSIONS_FILE, JSON.stringify(this.versions, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving ai-website-versions.json:', e);
    }
  }

  /**
   * Normalize any legacy or incoming record to the canonical WebsiteSpecification schema
   */
  public normalizeRecord(record: any): WebsiteSpecification {
    const res = validateWebsiteSpecification(record);
    if (res.isValid && res.sanitized) {
      return res.sanitized;
    }

    // Fallback normalization for legacy records
    const title = record.title || record.businessName || 'Untitled Website';
    const businessName = record.businessName || record.navigation?.brandName || 'Business';
    const desc = record.description || record.tagline || 'AI Generated Website';
    const primary = record.colors?.primary || record.theme?.palette?.primary || '#059669';
    const secondary = record.colors?.secondary || record.theme?.palette?.secondary || '#064e3b';
    const background = record.colors?.background || record.theme?.palette?.background || '#ffffff';
    const text = record.colors?.text || record.theme?.palette?.text || '#0f172a';
    const accent = record.colors?.accent || record.theme?.palette?.accent || '#10b981';

    const normalizedCandidate = {
      id: record.id,
      websiteId: record.websiteId || record.id,
      version: typeof record.version === 'number' ? record.version : (record.aiMetadata?.version || 1),
      title,
      businessName,
      businessType: record.businessType || 'General Business',
      description: desc,
      purpose: record.purpose || record.websitePurpose || 'Online presence',
      theme: record.theme?.style || (typeof record.theme === 'string' ? record.theme : 'Modern & Clean'),
      colors: { primary, secondary, background, text, accent },
      typography: {
        headingFont: record.typography?.headingFont || record.theme?.fontHeading || 'Inter, sans-serif',
        bodyFont: record.typography?.bodyFont || record.theme?.fontBody || 'Inter, sans-serif'
      },
      navigation: Array.isArray(record.navigation)
        ? record.navigation
        : (record.navigation?.links || []).map((l: any) => ({ label: l.label, pageId: l.pageId || l.href || '' })),
      pages: Array.isArray(record.pages) ? record.pages : [],
      sections: Array.isArray(record.sections) ? record.sections : (record.pages?.[0]?.sections || []),
      globalStyles: record.globalStyles || {},
      seo: record.seo || {
        title: `${businessName} | Official Website`,
        description: desc,
        keywords: [businessName, record.businessType || 'business']
      },
      footer: record.footer || {
        brandDescription: desc,
        copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
        links: [],
        contactInfo: {}
      },
      createdBy: record.createdBy || record.customerId || 'system',
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: record.updatedAt || new Date().toISOString(),
      customerId: record.customerId || record.createdBy,
      customerName: record.customerName || 'Customer',
      customerEmail: record.customerEmail || '',
      tagline: record.tagline || desc,
      originalInput: record.originalInput,
      aiMetadata: record.aiMetadata || {
        provider: 'webcraft-engine',
        generatedAt: record.createdAt || new Date().toISOString(),
        version: record.version || 1
      }
    };

    const finalRes = validateWebsiteSpecification(normalizedCandidate);
    if (finalRes.isValid && finalRes.sanitized) {
      return finalRes.sanitized;
    }

    // In worst-case, return as typed object
    return normalizedCandidate as WebsiteSpecification;
  }

  public create(spec: any, userContext?: { id: string; name: string }): WebsiteSpecification {
    const validation = validateWebsiteSpecification(spec);
    if (!validation.isValid || !validation.sanitized) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    const sanitized = validation.sanitized;
    this.websites.set(sanitized.id, sanitized);
    this.saveWebsites();

    // Snapshot version 1
    this.recordVersionSnapshot(sanitized, userContext?.id || sanitized.createdBy, 'Initial specification creation');

    return sanitized;
  }

  public getById(id: string): WebsiteSpecification | null {
    return this.websites.get(id) || null;
  }

  public getByCustomerId(customerId: string): WebsiteSpecification[] {
    return Array.from(this.websites.values())
      .filter(w => w.customerId === customerId || w.createdBy === customerId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getAll(filter?: { search?: string; businessType?: string }): WebsiteSpecification[] {
    let list = Array.from(this.websites.values());
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(w =>
        w.title.toLowerCase().includes(q) ||
        w.businessName.toLowerCase().includes(q) ||
        w.businessType.toLowerCase().includes(q) ||
        (w.customerName && w.customerName.toLowerCase().includes(q))
      );
    }
    if (filter?.businessType && filter.businessType !== 'All') {
      list = list.filter(w => w.businessType.toLowerCase() === filter.businessType!.toLowerCase());
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public update(
    id: string,
    updates: Partial<WebsiteSpecification>,
    userContext?: { id: string; name: string },
    changeNote?: string
  ): WebsiteSpecification {
    const existing = this.websites.get(id);
    if (!existing) {
      throw new Error('Website not found.');
    }

    const merged = {
      ...existing,
      ...updates,
      id: existing.id,
      websiteId: existing.websiteId,
      version: (existing.version || 1) + 1,
      updatedAt: new Date().toISOString()
    };

    if (merged.aiMetadata) {
      merged.aiMetadata.version = merged.version;
    }

    const validation = validateWebsiteSpecification(merged);
    if (!validation.isValid || !validation.sanitized) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    const sanitized = validation.sanitized;
    this.websites.set(id, sanitized);
    this.saveWebsites();

    // Snapshot new version
    this.recordVersionSnapshot(sanitized, userContext?.id || sanitized.createdBy, changeNote || `Updated to version ${sanitized.version}`);

    return sanitized;
  }

  public delete(id: string): boolean {
    if (!this.websites.has(id)) {
      throw new Error('Website not found.');
    }
    this.websites.delete(id);
    this.saveWebsites();
    return true;
  }

  // Version management
  public recordVersionSnapshot(spec: WebsiteSpecification, savedBy: string, changeNote?: string) {
    const snapshot: WebsiteVersionSnapshot = {
      websiteId: spec.id,
      version: spec.version,
      specification: JSON.parse(JSON.stringify(spec)),
      savedAt: new Date().toISOString(),
      savedBy,
      changeNote
    };

    // Keep unique snapshots per (websiteId, version)
    this.versions = this.versions.filter(v => !(v.websiteId === spec.id && v.version === spec.version));
    this.versions.push(snapshot);
    this.saveVersions();
  }

  public getVersions(websiteId: string): WebsiteVersionSnapshot[] {
    return this.versions
      .filter(v => v.websiteId === websiteId)
      .sort((a, b) => b.version - a.version);
  }

  public restoreVersion(websiteId: string, versionNumber: number, restoredBy: string): WebsiteSpecification {
    const targetVersion = this.versions.find(v => v.websiteId === websiteId && v.version === versionNumber);
    if (!targetVersion) {
      throw new Error(`Version ${versionNumber} not found for website ${websiteId}`);
    }

    const current = this.websites.get(websiteId);
    if (!current) {
      throw new Error('Website not found.');
    }

    const restoredSpec: WebsiteSpecification = {
      ...JSON.parse(JSON.stringify(targetVersion.specification)),
      version: (current.version || 1) + 1,
      updatedAt: new Date().toISOString()
    };

    if (restoredSpec.aiMetadata) {
      restoredSpec.aiMetadata.version = restoredSpec.version;
    }

    const validation = validateWebsiteSpecification(restoredSpec);
    if (!validation.isValid || !validation.sanitized) {
      throw new Error(`Restored specification failed validation: ${validation.errors.join('; ')}`);
    }

    this.websites.set(websiteId, validation.sanitized);
    this.saveWebsites();

    this.recordVersionSnapshot(
      validation.sanitized,
      restoredBy,
      `Restored from historical revision v${versionNumber}`
    );

    return validation.sanitized;
  }
}

export const aiWebsiteDb = new AiWebsiteDatabase();
