export type OrderType = 'custom_website' | 'template' | 'product';

export type CustomWebsiteOrderStatus =
  | 'NEW'
  | 'REQUIREMENTS_REVIEW'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PREVIEW_READY'
  | 'REVISION_REQUESTED'
  | 'REVISED'
  | 'CUSTOMER_APPROVED'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface BusinessInfo {
  businessName: string;
  businessType: string;
  businessDescription: string;
  industryCategory: string;
  websitePurpose: string;
  location: string;
  businessHours: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  socialLinks: string[];
}

export interface WebsiteRequirements {
  requiredPages: string[];
  requiredSections: string[];
  servicesOffered: string[];
  productsOffered: string[];
  featuresNeeded: string[];
  targetAudience: string;
  additionalNotes?: string;
}

export interface DesignPreferences {
  preferredColors: string[];
  preferredStyle: string;
  preferredTypography: string;
  websiteMood: string;
  referenceWebsiteUrl?: string;
  logoUrl?: string;
  assetUrls?: string[];
  additionalDesignNotes?: string;
}

export interface SelectedPackage {
  packageId: string;
  packageName: string;
  price: number;
  currency: string;
  pageLimit?: number;
  revisionLimit?: number;
  deliveryDays?: number;
  supportLevel?: string;
  features?: string[];
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: CustomWebsiteOrderStatus | 'NONE';
  toStatus: CustomWebsiteOrderStatus;
  changedByUserId: string;
  changedByUserName: string;
  changedByUserRole: string;
  notes?: string;
  timestamp: string;
}

export interface TemplateOrderDetails {
  templateId: string;
  templateName: string;
  templateCategory: string;
  templateThumbnail: string;
  vendorId: string;
  vendorName: string;
  technology: string;
  version: string;
}

export interface ProductOrderDetails {
  productId: string;
  productName: string;
  productCategory: string;
  productImage?: string;
  vendorId: string;
  vendorName: string;
  quantity: number;
  unitPrice: number;
}

export interface CustomWebsiteOrder {
  id: string;
  orderNumber: string;
  type: OrderType;
  customerId: string;
  customerName: string;
  customerEmail: string;
  businessInfo?: BusinessInfo;
  requirements?: WebsiteRequirements;
  designPreferences?: DesignPreferences;
  package?: SelectedPackage;
  templateDetails?: TemplateOrderDetails;
  productDetails?: ProductOrderDetails;
  vendorId?: string; // For marketplace template orders or product orders
  status: CustomWebsiteOrderStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffRole?: 'admin' | 'manager';
  statusHistory: StatusHistoryEntry[];
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paymentProvider?: string;
  paymentReference?: string;
  amount: number;
  previewUrl?: string;
  deliveredUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPackageOption {
  id: string;
  name: string;
  badge: string;
  price: number;
  description: string;
  pageLimit: string;
  turnaround: string;
  features: string[];
  popular: boolean;
}
