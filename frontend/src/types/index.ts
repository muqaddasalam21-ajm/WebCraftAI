export type TemplateCategory =
  | 'All'
  | 'E-commerce'
  | 'Beauty'
  | 'Furniture'
  | 'Restaurant'
  | 'Portfolio'
  | 'Agency'
  | 'Education'
  | 'Real Estate';

export type TemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Template {
  id: string;
  name: string;
  category: string;
  price: string | number;
  isFree?: boolean;
  description: string;
  image?: string;
  thumbnail?: string;
  previewUrl?: string;
  demoUrl?: string;
  templateFiles?: string[];
  vendorId?: string;
  vendorName?: string;
  status?: TemplateStatus;
  featured?: boolean;
  rating: number;
  downloads?: number;
  downloadsCount?: number;
  tags: string[];
  features?: string[];
  pages?: string[];
  technology?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateStats {
  totalTemplates: number;
  publishedTemplates: number;
  draftTemplates: number;
  archivedTemplates: number;
  totalTemplateOrders: number;
  totalTemplateSales: number;
}

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

export type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  assignedUser: string;
  amount: number;
  status: OrderStatus;
  date: string;
  paymentStatus: 'Paid' | 'Unpaid' | 'Refunded';
}

export type UserRole = 'Admin' | 'User' | 'Vendor' | 'Manager';
export type UserStatus = 'Active' | 'Pending' | 'Inactive';

export interface UserProfileData {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  company?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profile?: UserProfileData;
  joinedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  avatar?: string;
  ordersCount?: number;
}

export interface Vendor {
  id: string;
  name: string;
  company?: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  status: 'Verified' | 'Inactive';
  productsCount: number;
  totalSales?: number;
  rating: number;
  joinedDate: string;
}

export interface SalesReportMonth {
  month: string;
  sales: number;
  orders: number;
  profit: number;
  loss: number;
}

export interface StatItem {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  provider?: string;
}

export interface AISession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface SearchResultItem {
  id: string;
  title: string;
  category: 'Template' | 'Product' | 'Order';
  subtitle: string;
  route: string;
}
// Types for Phase 5 Custom Website Orders & Notifications
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

export interface CustomWebsiteOrder {
  id: string;
  orderNumber: string;
  type: 'custom_website' | 'template' | 'product';
  customerId: string;
  customerName: string;
  customerEmail: string;
  businessInfo?: BusinessInfo;
  requirements?: WebsiteRequirements;
  designPreferences?: DesignPreferences;
  package?: SelectedPackage;
  templateDetails?: TemplateOrderDetails;
  vendorId?: string;
  status: CustomWebsiteOrderStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffRole?: 'admin' | 'manager';
  statusHistory: StatusHistoryEntry[];
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID';
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

export type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_UPDATED'
  | 'ORDER_ASSIGNED'
  | 'REVISION_SUBMITTED'
  | 'SYSTEM_ALERT'
  | 'PROJECT_CREATED'
  | 'PROJECT_ASSIGNED'
  | 'PROJECT_STATUS_CHANGED'
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'MILESTONE_CREATED'
  | 'MILESTONE_COMPLETED'
  | 'PAYMENT_SUCCESSFUL'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'ACCOUNT_CREATED'
  | 'CUSTOMER_APPROVAL'
  | 'FINAL_DELIVERY';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  orderId?: string;
  orderNumber?: string;
  projectId?: string;
  projectNumber?: string;
  referenceId?: string;
  referenceType?: 'ORDER' | 'PROJECT' | 'TASK' | 'USER';
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type EmailEventType =
  | 'ACCOUNT_CREATED'
  | 'NEW_ORDER'
  | 'TEMPLATE_PURCHASE'
  | 'CUSTOM_ORDER'
  | 'PROJECT_ASSIGNED'
  | 'PROJECT_STATUS_CHANGED'
  | 'TASK_ASSIGNED'
  | 'CUSTOMER_APPROVAL'
  | 'FINAL_DELIVERY';

export type EmailStatus = 'SENT' | 'FAILED' | 'SIMULATED' | 'QUEUED';

export interface EmailLog {
  id: string;
  eventId: string;
  eventType: EmailEventType;
  to: string;
  recipientName: string;
  subject: string;
  text: string;
  html: string;
  referenceId?: string;
  referenceType?: 'ORDER' | 'PROJECT' | 'TASK' | 'USER';
  status: EmailStatus;
  provider: 'resend' | 'local_outbox';
  providerMessageId?: string;
  error?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PackageSupportLevel = 'basic' | 'standard' | 'priority' | 'dedicated';

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
  supportLevel: PackageSupportLevel;
  isActive: boolean;
  featured: boolean;
  sortOrder: number;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}
// ==========================================
// Phase 8: Website Project Lifecycle & Management
// ==========================================

export type ProjectStatus =
  | 'PLANNING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'REVIEW'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED';

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export type MilestoneStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BLOCKED';

export type PriorityLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT';

export type RevisionStatus =
  | 'REQUESTED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CANCELLED';

export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  title: string;
  description: string;
  previewUrl: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface ProjectRevision {
  id: string;
  projectId: string;
  versionId: string;
  customerId: string;
  customerName?: string;
  revisionNumber: number;
  requestedChanges: string;
  status: RevisionStatus;
  staffNotes?: string;
  resolvedVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectApproval {
  id: string;
  projectId: string;
  customerId: string;
  customerName?: string;
  approvedVersionId: string;
  versionNumber: number;
  feedback?: string;
  approvedAt: string;
}

export interface ProjectDelivery {
  id: string;
  projectId: string;
  approvalId: string;
  approvedVersionId: string;
  deliveredBy: string;
  deliveredByName: string;
  deliveredUrl: string;
  deliveryNotes?: string;
  deliveredAt: string;
}

export interface WebsiteProject {
  id: string;
  projectNumber: string;
  customWebsiteOrderId: string;
  customerId: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  packageCurrency: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  assignedTo?: string;
  startDate?: string;
  estimatedDeliveryDate?: string;
  completedDate?: string;
  progress: number;
  currentVersionId?: string;
  approvalId?: string;
  deliveryId?: string;
  deliveredUrl?: string;
  revisionCount?: number;
  revisionLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: PriorityLevel;
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: MilestoneStatus;
  dueDate?: string;
  completedAt?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStatusHistory {
  id: string;
  projectId: string;
  previousStatus?: ProjectStatus;
  newStatus?: ProjectStatus;
  status: ProjectStatus;
  changedBy: string;
  changedByName?: string;
  note?: string;
  createdAt: string;
}

// ==========================================
// ==========================================
// Phase 9 & 10: Canonical Website Specification Schema
// ==========================================

export const SUPPORTED_SECTION_TYPES = [
  'HERO',
  'TEXT',
  'IMAGE',
  'ABOUT',
  'SERVICES',
  'PRODUCTS',
  'FEATURES',
  'GALLERY',
  'TESTIMONIALS',
  'FAQ',
  'CTA',
  'CONTACT',
  'TEAM',
  'PRICING',
  'STATS',
  'BLOG',
  'CUSTOM'
] as const;

export type SectionType = (typeof SUPPORTED_SECTION_TYPES)[number];

export interface CanonicalColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface CanonicalTypography {
  headingFont: string;
  bodyFont: string;
}

export interface CanonicalNavigationItem {
  label: string;
  pageId: string;
}

export interface CanonicalSection {
  id: string;
  type: SectionType;
  order: number;
  visible: boolean;
  content: Record<string, any>;
  styles: Record<string, any>;
  data: Record<string, any>;
}

export interface CanonicalPage {
  id: string;
  name: string;
  slug: string;
  title: string;
  sections: CanonicalSection[];
}

export interface CanonicalSeo {
  title: string;
  description: string;
  keywords: string[];
}

export interface CanonicalFooter {
  brandDescription: string;
  copyright: string;
  links: Array<{
    label: string;
    href: string;
  }>;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface WebsiteSpecification {
  id: string;
  websiteId: string;
  version: number;
  title: string;
  businessName: string;
  businessType: string;
  description: string;
  purpose: string;
  theme: string;
  colors: CanonicalColors;
  typography: CanonicalTypography;
  navigation: CanonicalNavigationItem[];
  pages: CanonicalPage[];
  sections: CanonicalSection[];
  globalStyles: Record<string, any>;
  seo: CanonicalSeo;
  footer: CanonicalFooter;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Backward compatibility fields
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  tagline?: string;
  originalInput?: any;
  aiMetadata?: {
    provider: 'gemini' | 'openai' | 'webcraft-engine';
    generatedAt: string;
    version: number;
  };
}

export interface WebsiteVersionSnapshot {
  websiteId: string;
  version: number;
  specification: WebsiteSpecification;
  savedAt: string;
  savedBy: string;
  changeNote?: string;
}

export interface AiWebsiteInput {
  businessName: string;
  businessType: string;
  description: string;
  websitePurpose: string;
  requiredPages?: string[];
  servicesOrProducts?: Array<{
    title: string;
    description: string;
    price?: string;
    icon?: string;
  }>;
  contactInfo?: {
    email: string;
    phone?: string;
    address?: string;
    socialLinks?: string[];
  };
  preferredColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    surface?: string;
    text?: string;
    themeName?: string;
  };
  preferredStyle?: string;
  referenceWebsite?: string;
}

// Backward compatibility types for legacy consumers
export type WebsiteSection = CanonicalSection;
export type WebsitePage = CanonicalPage;
export interface WebsiteTheme {
  style: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
}
export interface WebsiteNavigation {
  brandName: string;
  logoText?: string;
  links: Array<{
    label: string;
    pageId?: string;
    sectionId?: string;
    href?: string;
  }>;
  ctaButton?: {
    label: string;
    action: string;
    targetSection?: string;
  };
}
export interface WebsiteFooter extends CanonicalFooter {}

// ==========================================
// Phase 11: Real Checkout & Payment Types
// ==========================================

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export type PaymentMethod = 'card' | 'bank_transfer' | 'digital_wallet';

export type PaymentProviderType = 'webcraft_pay' | 'stripe' | 'paypal';

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  provider: PaymentProviderType;
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: {
    brand?: string;
    last4?: string;
    walletType?: string;
  };
  failureReason?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSummary {
  orderId?: string;
  orderNumber?: string;
  itemType: 'custom_website' | 'template' | 'product';
  itemId: string;
  itemName: string;
  itemDescription?: string;
  subtotal: number;
  tax: number;
  fees: number;
  total: number;
  currency: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
}

