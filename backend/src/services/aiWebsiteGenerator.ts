import crypto from 'crypto';
import { config } from '../config';
import {
  AiWebsiteInput
} from '../models/aiWebsite';
import {
  WebsiteSpecification,
  CanonicalPage,
  CanonicalSection,
  SectionType,
  SUPPORTED_SECTION_TYPES,
  validateWebsiteSpecification
} from '../models/websiteSpecificationSchema';

export class AiWebsiteGenerator {
  public async generate(
    input: AiWebsiteInput,
    customer: { id: string; name: string; email: string },
    existingId?: string,
    existingVersion: number = 0
  ): Promise<WebsiteSpecification> {
    const websiteId = existingId || `aiw_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const version = existingVersion + 1;
    const now = new Date().toISOString();

    let rawCandidate: any = null;

    // 1. Try Gemini Provider if configured
    if (config.geminiApiKey) {
      try {
        rawCandidate = await this.generateWithGemini(input, customer, websiteId, version, now);
      } catch (err: any) {
        console.warn('Gemini website generation failed, trying fallback:', err?.message || err);
      }
    }

    // 2. Try OpenAI Provider if configured
    if (!rawCandidate && config.openaiApiKey) {
      try {
        rawCandidate = await this.generateWithOpenAI(input, customer, websiteId, version, now);
      } catch (err: any) {
        console.warn('OpenAI website generation failed, falling back to WebCraftAI Engine:', err?.message || err);
      }
    }

    // 3. Fallback to WebCraftAI Contextual Structured Engine
    if (!rawCandidate) {
      rawCandidate = this.generateWithWebCraftEngine(input, customer, websiteId, version, now);
    }

    // Strict validation and sanitization
    const validation = validateWebsiteSpecification(rawCandidate);
    if (!validation.isValid || !validation.sanitized) {
      console.error('Specification validation errors:', validation.errors);
      throw new Error(`AI generated invalid specification: ${validation.errors.join('; ')}`);
    }

    return validation.sanitized;
  }

  private buildSystemPrompt(): string {
    return `You are WebCraftAI's Lead Architect and Creative Director. Your job is to generate a comprehensive, production-grade canonical website specification in JSON.
Output ONLY raw valid JSON (no markdown formatting, no code blocks, no backticks).
The JSON must strictly conform to this schema:
{
  "title": "string",
  "businessName": "string",
  "businessType": "string",
  "description": "string",
  "purpose": "string",
  "theme": "string",
  "colors": {
    "primary": "hex color",
    "secondary": "hex color",
    "background": "hex color",
    "text": "hex color",
    "accent": "hex color"
  },
  "typography": {
    "headingFont": "string",
    "bodyFont": "string"
  },
  "navigation": [
    { "label": "string", "pageId": "string" }
  ],
  "pages": [
    {
      "id": "page_home",
      "name": "Home",
      "slug": "home",
      "title": "Home",
      "sections": [
        {
          "id": "sec_hero",
          "type": "HERO",
          "order": 0,
          "visible": true,
          "content": {
            "heading": "string",
            "subheading": "string",
            "body": "string",
            "primaryCta": { "label": "string", "href": "#contact" },
            "secondaryCta": { "label": "string", "href": "#services" },
            "imagePlaceholder": "https://images.unsplash.com/..."
          },
          "styles": {},
          "data": {}
        }
      ]
    }
  ],
  "globalStyles": {},
  "seo": {
    "title": "string",
    "description": "string",
    "keywords": ["string"]
  },
  "footer": {
    "brandDescription": "string",
    "copyright": "string",
    "links": [{ "label": "string", "href": "string" }],
    "contactInfo": { "email": "string", "phone": "string", "address": "string" }
  }
}
Every section type must be one of: HERO, TEXT, IMAGE, ABOUT, SERVICES, PRODUCTS, FEATURES, GALLERY, TESTIMONIALS, FAQ, CTA, CONTACT, TEAM, PRICING, STATS, BLOG, CUSTOM.`;
  }

  private async generateWithGemini(
    input: AiWebsiteInput,
    customer: { id: string; name: string; email: string },
    websiteId: string,
    version: number,
    now: string
  ): Promise<any | null> {
    const prompt = `Generate a complete canonical website specification for:
Business Name: ${input.businessName}
Business Type: ${input.businessType}
Description: ${input.description}
Purpose: ${input.websitePurpose}
Required Pages: ${(input.requiredPages || ['Home', 'About Us', 'Services', 'Contact']).join(', ')}
Services / Offerings: ${JSON.stringify(input.servicesOrProducts || [])}
Contact Email: ${input.contactInfo?.email || customer.email}
Phone: ${input.contactInfo?.phone || ''}
Address: ${input.contactInfo?.address || ''}
Preferred Colors: ${JSON.stringify(input.preferredColors || {})}
Preferred Style: ${input.preferredStyle || 'Modern & Clean'}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;
    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: this.buildSystemPrompt() }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json'
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return null;
    const data: any = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    return this.buildCandidateSpecification(parsed, input, customer, websiteId, version, now, 'gemini');
  }

  private async generateWithOpenAI(
    input: AiWebsiteInput,
    customer: { id: string; name: string; email: string },
    websiteId: string,
    version: number,
    now: string
  ): Promise<any | null> {
    const prompt = `Generate a complete canonical website specification for:
Name: ${input.businessName}
Type: ${input.businessType}
Description: ${input.description}
Purpose: ${input.websitePurpose}
Pages: ${(input.requiredPages || ['Home', 'About Us', 'Services', 'Contact']).join(', ')}
Services: ${JSON.stringify(input.servicesOrProducts || [])}
Colors: ${JSON.stringify(input.preferredColors || {})}
Style: ${input.preferredStyle || 'Modern & Clean'}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: this.buildSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });

    if (!res.ok) return null;
    const data: any = await res.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) return null;

    const parsed = JSON.parse(reply);
    return this.buildCandidateSpecification(parsed, input, customer, websiteId, version, now, 'openai');
  }

  /**
   * High-intelligence contextual fallback engine
   */
  private generateWithWebCraftEngine(
    input: AiWebsiteInput,
    customer: { id: string; name: string; email: string },
    websiteId: string,
    version: number,
    now: string
  ): any {
    const type = (input.businessType || 'business').toLowerCase();
    const name = input.businessName.trim();
    const desc = input.description.trim();

    // Determine custom palette
    const colors = input.preferredColors || {};
    const primaryColor = colors.primary || '#059669';
    const secondaryColor = colors.secondary || '#064e3b';
    const accentColor = colors.accent || '#10b981';
    const bgColor = colors.background || '#ffffff';
    const textColor = colors.text || '#0f172a';

    const serviceItems = (input.servicesOrProducts && input.servicesOrProducts.length > 0)
      ? input.servicesOrProducts.map((s, idx) => ({
          title: s.title,
          description: s.description,
          price: s.price || 'Custom Quote',
          icon: s.icon || 'Sparkles',
          tag: idx === 0 ? 'Popular' : 'Featured'
        }))
      : this.getDefaultServiceItems(type, name);

    // Build home sections with strict canonical uppercase section types
    const homeSections: CanonicalSection[] = [
      {
        id: `sec_hero_${Date.now()}`,
        type: 'HERO',
        order: 0,
        visible: true,
        content: {
          heading: `Empowering Your Vision with ${name}`,
          subheading: desc || `Welcome to ${name}. We deliver premier ${type} solutions designed to elevate your brand and exceed expectations.`,
          body: `Discover how our bespoke approach combines industry expertise, modern design, and dedicated service to deliver unmatched value.`,
          primaryCta: { label: 'Get Started Today', href: '#contact' },
          secondaryCta: { label: 'Explore Our Offerings', href: '#services' },
          imagePlaceholder: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
        },
        styles: {
          textAlign: 'center',
          paddingY: '80px'
        },
        data: {}
      },
      {
        id: `sec_services_${Date.now()}`,
        type: 'SERVICES',
        order: 1,
        visible: true,
        content: {
          heading: 'Our Signature Offerings',
          subheading: `Tailored solutions engineered specifically for excellence in ${type}.`
        },
        styles: {
          columns: 3
        },
        data: {
          items: serviceItems
        }
      },
      {
        id: `sec_about_${Date.now()}`,
        type: 'ABOUT',
        order: 2,
        visible: true,
        content: {
          heading: `About ${name}`,
          subheading: 'A commitment to craftsmanship, transparency, and client success.',
          body: `At ${name}, we believe in transforming ambitious visions into high-impact realities. Guided by precision and driven by innovation, our team brings together the best in ${type} to partner with you every step of the way.`,
          imagePlaceholder: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
        },
        styles: {},
        data: {}
      },
      {
        id: `sec_testimonials_${Date.now()}`,
        type: 'TESTIMONIALS',
        order: 3,
        visible: true,
        content: {
          heading: 'What Our Clients Say',
          subheading: 'Real feedback from partners who trust our expertise.'
        },
        styles: {},
        data: {
          items: [
            {
              title: 'Alexandra Reed',
              description: `Working with ${name} completely revitalized our operations. Their attention to detail and proactive communication set a new benchmark.`,
              tag: 'Verified Client'
            },
            {
              title: 'Marcus Vance',
              description: `Exceptional quality and timely execution. The results speak for themselves, and we couldn't be happier with our partnership.`,
              tag: 'Corporate Partner'
            },
            {
              title: 'Elena Rostova',
              description: `From our initial consultation to final delivery, the team was brilliant. Highly recommended for anyone seeking top-tier ${type} services.`,
              tag: 'Entrepreneur'
            }
          ]
        }
      },
      {
        id: `sec_contact_${Date.now()}`,
        type: 'CONTACT',
        order: 4,
        visible: true,
        content: {
          heading: 'Let’s Start a Conversation',
          subheading: 'Ready to take the next step? Reach out directly and our team will get back to you promptly.'
        },
        styles: {},
        data: {
          formFields: ['Full Name', 'Email Address', 'Phone Number', 'Message / Inquiries']
        }
      }
    ];

    const pages: CanonicalPage[] = [
      {
        id: 'page_home',
        name: 'Home',
        slug: 'home',
        title: `${name} | Home`,
        sections: homeSections
      }
    ];

    const pageNames = input.requiredPages && input.requiredPages.length > 0
      ? input.requiredPages
      : ['Home', 'About Us', 'Services', 'Testimonials', 'Contact'];

    pageNames.filter(p => p.toLowerCase() !== 'home').forEach((pName, idx) => {
      const isContact = pName.toLowerCase().includes('contact');
      const isPricing = pName.toLowerCase().includes('pricing');

      let secType: SectionType = 'FEATURES';
      if (isContact) secType = 'CONTACT';
      if (isPricing) secType = 'PRICING';

      pages.push({
        id: `page_${pName.toLowerCase().replace(/\s+/g, '_')}`,
        name: pName,
        slug: pName.toLowerCase().replace(/\s+/g, '-'),
        title: `${pName} | ${name}`,
        sections: [
          {
            id: `sec_${idx}_hero`,
            type: 'HERO',
            order: 0,
            visible: true,
            content: {
              heading: pName,
              subheading: `Detailed information and resources regarding ${pName} at ${name}.`,
              body: `Learn more about our standards, methodologies, and offerings tailored for ${pName.toLowerCase()}.`
            },
            styles: {},
            data: {}
          },
          {
            id: `sec_${idx}_content`,
            type: secType,
            order: 1,
            visible: true,
            content: {
              heading: `${pName} Overview`,
              subheading: `Explore our dedicated ${pName.toLowerCase()} solutions.`
            },
            styles: {},
            data: {
              items: serviceItems.slice(0, 3),
              formFields: isContact ? ['Your Name', 'Email Address', 'Subject', 'Message'] : undefined
            }
          }
        ]
      });
    });

    const navigation = pages.map(p => ({
      label: p.name,
      pageId: p.id
    }));

    return {
      id: websiteId,
      websiteId,
      version,
      title: `${name} | Official Website`,
      businessName: name,
      businessType: input.businessType,
      description: desc,
      purpose: input.websitePurpose || 'Showcase products, services, and brand value online',
      theme: input.preferredStyle || 'Modern & Clean',
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        background: bgColor,
        text: textColor,
        accent: accentColor
      },
      typography: {
        headingFont: 'Inter, system-ui, sans-serif',
        bodyFont: 'Inter, system-ui, sans-serif'
      },
      navigation,
      pages,
      sections: homeSections,
      globalStyles: {
        borderRadius: '16px',
        containerMaxWidth: '1200px'
      },
      seo: {
        title: `${name} | Official Website`,
        description: desc ? desc.slice(0, 160) : `Official website for ${name}.`,
        keywords: [name, input.businessType, 'official website', 'services']
      },
      footer: {
        brandDescription: `${name} — Premium ${type} solutions designed to inspire and achieve tangible results.`,
        copyright: `© ${new Date().getFullYear()} ${name}. All rights reserved.`,
        links: pages.map(p => ({ label: p.name, href: `#${p.slug}` })),
        contactInfo: {
          email: input.contactInfo?.email || customer.email,
          phone: input.contactInfo?.phone || '+1 (555) 234-5678',
          address: input.contactInfo?.address || '100 Innovation Blvd, Suite 400'
        }
      },
      createdBy: customer.id,
      createdAt: now,
      updatedAt: now,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      tagline: desc ? desc.slice(0, 80) : `Premier ${input.businessType} Solutions`,
      originalInput: input,
      aiMetadata: {
        provider: 'webcraft-engine',
        generatedAt: now,
        version
      }
    };
  }

  private getDefaultServiceItems(type: string, name: string) {
    return [
      {
        title: 'Core Consulting & Strategy',
        description: 'Comprehensive analysis and bespoke roadmaps to position your brand for sustainable growth.',
        icon: 'Compass',
        price: 'From $499',
        tag: 'Popular'
      },
      {
        title: 'Full-Service Implementation',
        description: 'End-to-end execution combining advanced industry tooling and meticulous craftsmanship.',
        icon: 'Layers',
        price: 'From $1,299',
        tag: 'Recommended'
      },
      {
        title: 'Ongoing Support & Advisory',
        description: 'Dedicated assistance and continuous optimization ensuring long-term performance and peace of mind.',
        icon: 'ShieldCheck',
        price: 'From $299/mo',
        tag: 'Essential'
      }
    ];
  }

  private buildCandidateSpecification(
    parsed: any,
    input: AiWebsiteInput,
    customer: { id: string; name: string; email: string },
    websiteId: string,
    version: number,
    now: string,
    provider: 'gemini' | 'openai'
  ): any {
    const businessName = parsed.businessName || input.businessName;
    const desc = parsed.description || input.description;

    return {
      id: websiteId,
      websiteId,
      version,
      title: parsed.title || `${businessName} | Official Website`,
      businessName,
      businessType: parsed.businessType || input.businessType,
      description: desc,
      purpose: parsed.purpose || input.websitePurpose || 'Showcase products, services, and brand value online',
      theme: parsed.theme || input.preferredStyle || 'Modern & Clean',
      colors: parsed.colors || {
        primary: '#059669',
        secondary: '#064e3b',
        background: '#ffffff',
        text: '#0f172a',
        accent: '#10b981'
      },
      typography: parsed.typography || {
        headingFont: 'Inter, sans-serif',
        bodyFont: 'Inter, sans-serif'
      },
      navigation: Array.isArray(parsed.navigation) ? parsed.navigation : [{ label: 'Home', pageId: 'page_home' }],
      pages: Array.isArray(parsed.pages) ? parsed.pages : [],
      sections: Array.isArray(parsed.sections) ? parsed.sections : (parsed.pages?.[0]?.sections || []),
      globalStyles: parsed.globalStyles || {},
      seo: parsed.seo || {
        title: `${businessName} | Official Website`,
        description: desc,
        keywords: [businessName, input.businessType]
      },
      footer: parsed.footer || {
        brandDescription: desc,
        copyright: `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`,
        links: [],
        contactInfo: { email: input.contactInfo?.email || customer.email }
      },
      createdBy: customer.id,
      createdAt: now,
      updatedAt: now,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      tagline: parsed.tagline || desc.slice(0, 80),
      originalInput: input,
      aiMetadata: {
        provider,
        generatedAt: now,
        version
      }
    };
  }
}

export const aiWebsiteGenerator = new AiWebsiteGenerator();
