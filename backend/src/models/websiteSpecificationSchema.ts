/**
 * Canonical Website Specification Schema
 * Single source of truth for WebCraftAI AI Builder and AI Editor.
 */

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
  sections: CanonicalSection[]; // Flat catalog or default sections
  globalStyles: Record<string, any>;
  seo: CanonicalSeo;
  footer: CanonicalFooter;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Metadata & backward compatibility properties
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
  legacyTheme?: any;
}

export interface SpecificationValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: WebsiteSpecification;
}

/**
 * XSS & script payload stripper for sanitization
 */
function sanitizeString(val: any, fallback: string = ''): string {
  if (typeof val !== 'string') return fallback;
  return val
    .replace(/<script[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .trim();
}

/**
 * Deep sanitization for strings within arbitrary objects
 */
function sanitizeDeep(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeDeep);
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[sanitizeString(k)] = sanitizeDeep(v);
    }
    return out;
  }
  return obj;
}

/**
 * Strict validator and sanitizer for canonical WebsiteSpecification
 */
export function validateWebsiteSpecification(data: any): SpecificationValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Specification must be a non-null JSON object.'] };
  }

  // Required top-level string fields
  const requiredStringFields: Array<keyof WebsiteSpecification> = [
    'title',
    'businessName',
    'businessType',
    'description',
    'purpose',
    'theme'
  ];

  for (const field of requiredStringFields) {
    if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
      errors.push(`Field "${field}" is required and must be a non-empty string.`);
    }
  }

  // Colors validation
  if (!data.colors || typeof data.colors !== 'object') {
    errors.push('Field "colors" must be an object with primary, secondary, background, text, accent.');
  } else {
    const reqColors = ['primary', 'secondary', 'background', 'text', 'accent'];
    for (const col of reqColors) {
      if (!data.colors[col] || typeof data.colors[col] !== 'string') {
        errors.push(`Color field "${col}" is required and must be a string.`);
      }
    }
  }

  // Typography validation
  if (!data.typography || typeof data.typography !== 'object') {
    errors.push('Field "typography" must be an object with headingFont and bodyFont.');
  } else {
    if (!data.typography.headingFont || typeof data.typography.headingFont !== 'string') {
      errors.push('Typography field "headingFont" is required.');
    }
    if (!data.typography.bodyFont || typeof data.typography.bodyFont !== 'string') {
      errors.push('Typography field "bodyFont" is required.');
    }
  }

  // Navigation validation
  if (!Array.isArray(data.navigation)) {
    errors.push('Field "navigation" must be an array.');
  } else {
    data.navigation.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') {
        errors.push(`Navigation item [${idx}] must be an object.`);
      } else if (!item.label || typeof item.label !== 'string') {
        errors.push(`Navigation item [${idx}] must have a label.`);
      }
    });
  }

  // Pages validation
  if (!Array.isArray(data.pages) || data.pages.length === 0) {
    errors.push('Field "pages" must be an array with at least one page.');
  } else {
    data.pages.forEach((p: any, pageIdx: number) => {
      if (!p || typeof p !== 'object') {
        errors.push(`Page [${pageIdx}] must be an object.`);
        return;
      }
      if (!p.id || typeof p.id !== 'string') errors.push(`Page [${pageIdx}] must have a valid string "id".`);
      if (!p.name || typeof p.name !== 'string') errors.push(`Page [${pageIdx}] must have a valid string "name".`);
      if (!p.slug || typeof p.slug !== 'string') errors.push(`Page [${pageIdx}] must have a valid string "slug".`);
      if (!p.title || typeof p.title !== 'string') errors.push(`Page [${pageIdx}] must have a valid string "title".`);

      if (!Array.isArray(p.sections)) {
        errors.push(`Page "${p.name || pageIdx}" must contain a "sections" array.`);
      } else {
        p.sections.forEach((sec: any, secIdx: number) => {
          validateSection(sec, `Page "${p.name || pageIdx}" Section [${secIdx}]`, errors);
        });
      }
    });
  }

  // Top-level sections validation (flat catalog or default page sections)
  if (data.sections) {
    if (!Array.isArray(data.sections)) {
      errors.push('Field "sections" must be an array when provided.');
    } else {
      data.sections.forEach((sec: any, secIdx: number) => {
        validateSection(sec, `Top-level Section [${secIdx}]`, errors);
      });
    }
  }

  // SEO validation
  if (!data.seo || typeof data.seo !== 'object') {
    errors.push('Field "seo" must be an object with title, description, and keywords.');
  } else {
    if (!data.seo.title || typeof data.seo.title !== 'string') errors.push('SEO "title" is required.');
    if (!data.seo.description || typeof data.seo.description !== 'string') errors.push('SEO "description" is required.');
    if (!Array.isArray(data.seo.keywords)) errors.push('SEO "keywords" must be an array of strings.');
  }

  // Footer validation
  if (!data.footer || typeof data.footer !== 'object') {
    errors.push('Field "footer" must be an object.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Build sanitized canonical specification
  const sanitized: WebsiteSpecification = {
    id: sanitizeString(data.id),
    websiteId: sanitizeString(data.websiteId || data.id),
    version: typeof data.version === 'number' && data.version > 0 ? data.version : 1,
    title: sanitizeString(data.title),
    businessName: sanitizeString(data.businessName),
    businessType: sanitizeString(data.businessType),
    description: sanitizeString(data.description),
    purpose: sanitizeString(data.purpose),
    theme: sanitizeString(data.theme),
    colors: {
      primary: sanitizeString(data.colors.primary, '#059669'),
      secondary: sanitizeString(data.colors.secondary, '#064e3b'),
      background: sanitizeString(data.colors.background, '#ffffff'),
      text: sanitizeString(data.colors.text, '#0f172a'),
      accent: sanitizeString(data.colors.accent, '#10b981')
    },
    typography: {
      headingFont: sanitizeString(data.typography.headingFont, 'Inter, sans-serif'),
      bodyFont: sanitizeString(data.typography.bodyFont, 'Inter, sans-serif')
    },
    navigation: data.navigation.map((nav: any) => ({
      label: sanitizeString(nav.label),
      pageId: sanitizeString(nav.pageId || '')
    })),
    pages: data.pages.map((p: any) => ({
      id: sanitizeString(p.id),
      name: sanitizeString(p.name),
      slug: sanitizeString(p.slug),
      title: sanitizeString(p.title),
      sections: (p.sections || []).map(normalizeSanitizeSection)
    })),
    sections: Array.isArray(data.sections)
      ? data.sections.map(normalizeSanitizeSection)
      : (data.pages[0]?.sections || []).map(normalizeSanitizeSection),
    globalStyles: sanitizeDeep(data.globalStyles || {}),
    seo: {
      title: sanitizeString(data.seo.title),
      description: sanitizeString(data.seo.description),
      keywords: Array.isArray(data.seo.keywords) ? data.seo.keywords.map((k: any) => sanitizeString(k)) : []
    },
    footer: {
      brandDescription: sanitizeString(data.footer.brandDescription),
      copyright: sanitizeString(data.footer.copyright, `© ${new Date().getFullYear()} ${data.businessName}. All rights reserved.`),
      links: Array.isArray(data.footer.links) ? data.footer.links.map((l: any) => ({ label: sanitizeString(l.label), href: sanitizeString(l.href, '#') })) : [],
      contactInfo: {
        email: sanitizeString(data.footer.contactInfo?.email),
        phone: sanitizeString(data.footer.contactInfo?.phone),
        address: sanitizeString(data.footer.contactInfo?.address)
      }
    },
    createdBy: sanitizeString(data.createdBy || data.customerId || 'system'),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),

    // Preserved backward compatibility properties
    customerId: sanitizeString(data.customerId || data.createdBy),
    customerName: sanitizeString(data.customerName),
    customerEmail: sanitizeString(data.customerEmail),
    tagline: sanitizeString(data.tagline || data.description),
    originalInput: data.originalInput || undefined,
    aiMetadata: data.aiMetadata || {
      provider: 'webcraft-engine',
      generatedAt: new Date().toISOString(),
      version: data.version || 1
    },

    // Backward-compatibility legacy object projections
    legacyTheme: {
      style: sanitizeString(data.theme),
      palette: {
        primary: sanitizeString(data.colors?.primary, '#059669'),
        secondary: sanitizeString(data.colors?.secondary, '#064e3b'),
        accent: sanitizeString(data.colors?.accent, '#10b981'),
        background: sanitizeString(data.colors?.background, '#ffffff'),
        surface: sanitizeString(data.colors?.background, '#f8fafc'),
        text: sanitizeString(data.colors?.text, '#0f172a'),
        textMuted: '#64748b'
      },
      fontHeading: sanitizeString(data.typography?.headingFont, 'Inter, sans-serif'),
      fontBody: sanitizeString(data.typography?.bodyFont, 'Inter, sans-serif'),
      borderRadius: '16px'
    }
  };

  return { isValid: true, errors: [], sanitized };
}

function validateSection(sec: any, context: string, errors: string[]) {
  if (!sec || typeof sec !== 'object') {
    errors.push(`${context} must be an object.`);
    return;
  }
  if (!sec.id || typeof sec.id !== 'string') {
    errors.push(`${context} must have a valid string "id".`);
  }

  const rawType = typeof sec.type === 'string' ? sec.type.toUpperCase() : '';
  if (!SUPPORTED_SECTION_TYPES.includes(rawType as SectionType)) {
    errors.push(
      `${context} has unsupported type "${sec.type}". Must be one of: ${SUPPORTED_SECTION_TYPES.join(', ')}`
    );
  }

  if (typeof sec.order !== 'number') {
    errors.push(`${context} must have numeric "order".`);
  }
  if (typeof sec.visible !== 'boolean') {
    errors.push(`${context} must have boolean "visible".`);
  }
  if (sec.content !== undefined && (typeof sec.content !== 'object' || sec.content === null)) {
    errors.push(`${context} field "content" must be an object.`);
  }
  if (sec.styles !== undefined && (typeof sec.styles !== 'object' || sec.styles === null)) {
    errors.push(`${context} field "styles" must be an object.`);
  }
  if (sec.data !== undefined && (typeof sec.data !== 'object' || sec.data === null)) {
    errors.push(`${context} field "data" must be an object.`);
  }
}

function normalizeSanitizeSection(sec: any, idx: number): CanonicalSection {
  const rawType = typeof sec.type === 'string' ? sec.type.toUpperCase() : 'CUSTOM';
  const type: SectionType = (SUPPORTED_SECTION_TYPES.includes(rawType as SectionType)
    ? rawType
    : 'CUSTOM') as SectionType;

  // Normalize legacy properties into content/data if needed
  const content = {
    heading: sanitizeString(sec.heading || sec.content?.heading),
    subheading: sanitizeString(sec.subheading || sec.content?.subheading),
    body: sanitizeString(sec.content?.body || sec.content?.text || sec.content),
    primaryCta: sec.primaryCta || sec.content?.primaryCta,
    secondaryCta: sec.secondaryCta || sec.content?.secondaryCta,
    imagePlaceholder: sanitizeString(sec.imagePlaceholder || sec.content?.imagePlaceholder),
    ...sanitizeDeep(sec.content || {})
  };

  const data = {
    items: Array.isArray(sec.items) ? sanitizeDeep(sec.items) : (Array.isArray(sec.data?.items) ? sanitizeDeep(sec.data.items) : []),
    formFields: Array.isArray(sec.formFields) ? sanitizeDeep(sec.formFields) : (Array.isArray(sec.data?.formFields) ? sanitizeDeep(sec.data.formFields) : []),
    ...sanitizeDeep(sec.data || {})
  };

  const styles = sanitizeDeep(sec.styles || {});

  return {
    id: sanitizeString(sec.id || `sec_${idx}_${Date.now()}`),
    type,
    order: typeof sec.order === 'number' ? sec.order : idx,
    visible: typeof sec.visible === 'boolean' ? sec.visible : true,
    content,
    styles,
    data
  };
}
