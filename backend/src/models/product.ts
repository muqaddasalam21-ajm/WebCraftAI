export type ProductStatus = 'draft' | 'published' | 'archived';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image?: string;
  stock: number;
  vendorId: string;
  vendorName: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductStats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  archivedProducts: number;
  totalInventoryValue: number;
}

export interface CsvImportResult {
  totalRows: number;
  imported: number;
  failed: number;
  errors: string[];
  products: Product[];
}
