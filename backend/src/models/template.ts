export type TemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  thumbnail: string;
  previewUrl?: string;
  demoUrl?: string;
  templateFiles?: string[];
  vendorId: string;
  vendorName: string;
  status: TemplateStatus;
  tags: string[];
  features: string[];
  pages: string[];
  technology: string;
  version: string;
  downloadsCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateStats {
  totalTemplates: number;
  publishedTemplates: number;
  draftTemplates: number;
  archivedTemplates: number;
  totalTemplateOrders: number;
  totalTemplateSales: number;
}
