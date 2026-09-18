import fs from 'fs';
import path from 'path';
import { Template, TemplateStatus, TemplateStats } from '../models/template';

const TEMPLATES_FILE = path.join(__dirname, '../../data/templates.json');

class TemplateDatabase {
  private templates: Map<string, Template> = new Map();

  constructor() {
    this.load();
  }

  private load() {
    const dir = path.dirname(TEMPLATES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(TEMPLATES_FILE)) {
      try {
        const raw = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
        const list: Template[] = JSON.parse(raw);
        list.forEach(t => this.templates.set(t.id, t));
        return;
      } catch (err) {
        console.error('Error reading templates.json:', err);
      }
    }

    // Single source of truth - empty initially, no fake data
    this.templates.clear();
    this.save();
  }

  public save() {
    try {
      const dir = path.dirname(TEMPLATES_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.templates.values());
      fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving templates to disk:', err);
    }
  }

  public findById(id: string): Template | undefined {
    this.load();
    return this.templates.get(id);
  }

  public getAll(): Template[] {
    this.load();
    return Array.from(this.templates.values());
  }

  public getStats(vendorId?: string): TemplateStats {
    let list = Array.from(this.templates.values());
    if (vendorId) {
      list = list.filter(t => t.vendorId === vendorId);
    }

    return {
      totalTemplates: list.length,
      publishedTemplates: list.filter(t => t.status === 'PUBLISHED').length,
      draftTemplates: list.filter(t => t.status === 'DRAFT').length,
      archivedTemplates: list.filter(t => t.status === 'ARCHIVED').length,
      totalTemplateOrders: 0,
      totalTemplateSales: 0
    };
  }

  public create(data: {
    name: string;
    description: string;
    category: string;
    price: number;
    thumbnail?: string;
    previewUrl?: string;
    demoUrl?: string;
    templateFiles?: string[];
    vendorId: string;
    vendorName: string;
    status?: TemplateStatus;
    tags?: string[];
    features?: string[];
    pages?: string[];
    technology?: string;
    version?: string;
  }): Template {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Template name is required.');
    }
    if (!data.description || data.description.trim() === '') {
      throw new Error('Template description is required.');
    }
    if (!data.category || data.category.trim() === '') {
      throw new Error('Template category is required.');
    }
    if (typeof data.price !== 'number' || isNaN(data.price) || data.price < 0) {
      throw new Error('Template price must be a non-negative number.');
    }

    const now = new Date().toISOString();
    const id = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const validStatuses: TemplateStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
    const status: TemplateStatus = data.status && validStatuses.includes(data.status) ? data.status : 'DRAFT';

    const newTemplate: Template = {
      id,
      name: data.name.trim(),
      description: data.description.trim(),
      category: data.category.trim(),
      price: parseFloat(data.price.toFixed(2)),
      thumbnail: data.thumbnail || '',
      previewUrl: data.previewUrl?.trim() || '',
      demoUrl: data.demoUrl?.trim() || '',
      templateFiles: data.templateFiles || [],
      vendorId: data.vendorId,
      vendorName: data.vendorName,
      status,
      tags: data.tags || [],
      features: data.features || [],
      pages: data.pages || ['Home'],
      technology: data.technology?.trim() || 'React + Tailwind CSS',
      version: data.version?.trim() || '1.0.0',
      downloadsCount: 0,
      rating: 5.0,
      createdAt: now,
      updatedAt: now
    };

    this.templates.set(newTemplate.id, newTemplate);
    this.save();
    return newTemplate;
  }

  public update(id: string, updates: Partial<{
    name: string;
    description: string;
    category: string;
    price: number;
    thumbnail: string;
    previewUrl: string;
    demoUrl: string;
    templateFiles: string[];
    status: TemplateStatus;
    tags: string[];
    features: string[];
    pages: string[];
    technology: string;
    version: string;
  }>): Template {
    const template = this.templates.get(id);
    if (!template) throw new Error('Template not found.');

    if (updates.name !== undefined) {
      if (!updates.name.trim()) throw new Error('Template name cannot be empty.');
      template.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      if (!updates.description.trim()) throw new Error('Description cannot be empty.');
      template.description = updates.description.trim();
    }
    if (updates.category !== undefined) {
      if (!updates.category.trim()) throw new Error('Category cannot be empty.');
      template.category = updates.category.trim();
    }
    if (updates.price !== undefined) {
      if (typeof updates.price !== 'number' || isNaN(updates.price) || updates.price < 0) {
        throw new Error('Price must be a valid non-negative number.');
      }
      template.price = parseFloat(updates.price.toFixed(2));
    }
    if (updates.thumbnail !== undefined) template.thumbnail = updates.thumbnail;
    if (updates.previewUrl !== undefined) template.previewUrl = updates.previewUrl.trim();
    if (updates.demoUrl !== undefined) template.demoUrl = updates.demoUrl.trim();
    if (updates.templateFiles !== undefined) template.templateFiles = updates.templateFiles;
    if (updates.status !== undefined) {
      const validStatuses: TemplateStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
      if (!validStatuses.includes(updates.status)) throw new Error('Invalid template status.');
      template.status = updates.status;
    }
    if (updates.tags !== undefined) template.tags = updates.tags;
    if (updates.features !== undefined) template.features = updates.features;
    if (updates.pages !== undefined) template.pages = updates.pages;
    if (updates.technology !== undefined) template.technology = updates.technology.trim();
    if (updates.version !== undefined) template.version = updates.version.trim();

    template.updatedAt = new Date().toISOString();
    this.templates.set(template.id, template);
    this.save();
    return template;
  }

  public delete(id: string): void {
    const template = this.templates.get(id);
    if (!template) throw new Error('Template not found.');
    this.templates.delete(id);
    this.save();
  }

  public queryTemplates(params: {
    search?: string;
    category?: string;
    status?: string;
    vendorId?: string;
    publishedOnly?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    let list = Array.from(this.templates.values());

    // Customer scoping: only published
    if (params.publishedOnly) {
      list = list.filter(t => t.status === 'PUBLISHED');
    } else if (params.status && params.status !== 'All' && params.status !== 'all') {
      const s = params.status.toUpperCase();
      list = list.filter(t => t.status === s);
    }

    // Vendor filter
    if (params.vendorId && params.vendorId !== 'All' && params.vendorId !== 'all') {
      list = list.filter(t => t.vendorId === params.vendorId);
    }

    // Category filter
    if (params.category && params.category !== 'All' && params.category !== 'all') {
      const cat = params.category.toLowerCase();
      list = list.filter(t => t.category.toLowerCase() === cat);
    }

    // Real search across name, description, category, tags
    if (params.search && params.search.trim() !== '') {
      const q = params.search.trim().toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q)) ||
        t.features.some(f => f.toLowerCase().includes(q))
      );
    }

    // Sorting
    const sortOrder = params.sortOrder === 'desc' ? -1 : 1;
    if (params.sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name) * sortOrder);
    } else if (params.sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (params.sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (params.sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      // Default: newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = list.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 12);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      templates: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

export const templateDb = new TemplateDatabase();
