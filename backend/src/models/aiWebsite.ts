/**
 * AI Website Specification Re-export and Legacy Compatibility Layer
 * Single canonical schema defined in websiteSpecificationSchema.ts
 */

export * from './websiteSpecificationSchema';

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

// Backward-compatibility aliases
export interface WebsiteSectionItem {
  title: string;
  description: string;
  icon?: string;
  price?: string;
  tag?: string;
  imagePlaceholder?: string;
}

export type LegacyWebsiteSection = {
  id: string;
  type: string;
  heading?: string;
  subheading?: string;
  content?: string;
  primaryCta?: { label: string; href?: string };
  secondaryCta?: { label: string; href?: string };
  items?: WebsiteSectionItem[];
  imagePlaceholder?: string;
  formFields?: string[];
};
