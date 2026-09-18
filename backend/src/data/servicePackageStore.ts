import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CustomWebsitePackage, CreatePackageInput, UpdatePackageInput } from '../models/servicePackage';

const DATA_FILE = path.join(__dirname, '../../data/service-packages.json');

function loadPackages(): CustomWebsitePackage[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw) as CustomWebsitePackage[];
  } catch {
    return [];
  }
}

function savePackages(packages: CustomWebsitePackage[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(packages, null, 2), 'utf8');
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function ensureUniqueSlug(base: string, excludeId?: string): string {
  const packages = loadPackages();
  let slug = base;
  let counter = 1;
  while (packages.some(p => p.slug === slug && p.id !== excludeId)) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

export const servicePackageDb = {
  getAll(): CustomWebsitePackage[] {
    return loadPackages().sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getActive(): CustomWebsitePackage[] {
    return loadPackages()
      .filter(p => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getById(id: string): CustomWebsitePackage | null {
    return loadPackages().find(p => p.id === id) || null;
  },

  getBySlug(slug: string): CustomWebsitePackage | null {
    return loadPackages().find(p => p.slug === slug) || null;
  },

  create(input: CreatePackageInput, createdBy?: string, createdByName?: string): CustomWebsitePackage {
    const packages = loadPackages();
    const slug = ensureUniqueSlug(slugify(input.name));
    const maxSort = packages.reduce((max, p) => Math.max(max, p.sortOrder), 0);

    const newPkg: CustomWebsitePackage = {
      id: `pkg_${crypto.randomBytes(6).toString('hex')}`,
      name: input.name,
      slug,
      description: input.description,
      price: input.price,
      currency: input.currency || 'USD',
      pageLimit: input.pageLimit,
      includedPages: input.includedPages || [],
      features: input.features || [],
      revisionLimit: input.revisionLimit,
      deliveryDays: input.deliveryDays,
      supportLevel: input.supportLevel,
      isActive: input.isActive !== undefined ? input.isActive : true,
      featured: input.featured || false,
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : maxSort + 1,
      createdBy,
      createdByName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    packages.push(newPkg);
    savePackages(packages);
    return newPkg;
  },

  update(id: string, input: UpdatePackageInput): CustomWebsitePackage | null {
    const packages = loadPackages();
    const idx = packages.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const existing = packages[idx];
    let slug = existing.slug;

    if (input.name && input.name !== existing.name) {
      slug = ensureUniqueSlug(slugify(input.name), id);
    }

    const updated: CustomWebsitePackage = {
      ...existing,
      ...input,
      slug,
      updatedAt: new Date().toISOString()
    };

    packages[idx] = updated;
    savePackages(packages);
    return updated;
  },

  setStatus(id: string, isActive: boolean): CustomWebsitePackage | null {
    return this.update(id, { isActive });
  },

  delete(id: string): boolean {
    const packages = loadPackages();
    const idx = packages.findIndex(p => p.id === id);
    if (idx === -1) return false;
    packages.splice(idx, 1);
    savePackages(packages);
    return true;
  },

  count(): number {
    return loadPackages().length;
  }
};
