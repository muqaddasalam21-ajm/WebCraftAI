export interface CustomWebsitePackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  pageLimit: number;
  includedPages: string[];
  features: string[];
  revisionLimit: number;
  deliveryDays: number;
  supportLevel: 'basic' | 'standard' | 'priority' | 'dedicated';
  isActive: boolean;
  featured: boolean;
  sortOrder: number;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageInput {
  name: string;
  description: string;
  price: number;
  currency?: string;
  pageLimit: number;
  includedPages?: string[];
  features?: string[];
  revisionLimit: number;
  deliveryDays: number;
  supportLevel: CustomWebsitePackage['supportLevel'];
  isActive?: boolean;
  featured?: boolean;
  sortOrder?: number;
}

export type UpdatePackageInput = Partial<CreatePackageInput>;
