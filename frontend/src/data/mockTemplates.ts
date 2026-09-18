import { Template } from '../types';

export const mockTemplates: Template[] = [
  {
    id: 'tpl-1',
    name: 'Electronics – Device',
    category: 'Beauty',
    price: '$49',
    isFree: false,
    description: 'A radiant e-commerce storefront crafted for organic cosmetics, skincare rituals, and botanical beauty brands.',
    image: '/assets/templates/beauty-store.svg',
    featured: true,
    rating: 4.9,
    downloads: 1420,
    tags: ['Skincare', 'Cosmetics', 'Clean Design', 'E-commerce']
  },
  {
    id: 'tpl-2',
    name: 'Furniture – Home',
    category: 'Furniture',
    price: '$59',
    isFree: false,
    description: 'Architectural, Scandinavian-inspired furniture and interior design studio with high-resolution collection lookbooks.',
    image: '/assets/templates/furniture-studio.svg',
    featured: true,
    rating: 4.8,
    downloads: 980,
    tags: ['Interior', 'Minimalist', 'Woodcraft', 'Showroom']
  },
  {
    id: 'tpl-3',
    name: 'Restaurant – Gourmet',
    category: 'Restaurant',
    price: '$45',
    isFree: false,
    description: 'A sleek, sensory website for Michelin-star fine dining, culinary tasting menus, and online reservation booking.',
    image: '/assets/templates/restaurant-luxe.svg',
    featured: true,
    rating: 4.95,
    downloads: 870,
    tags: ['Fine Dining', 'Menu', 'Table Booking', 'Dark Theme']
  },
  {
    id: 'tpl-4',
    name: 'Alex Design Director',
    category: 'Portfolio',
    price: 'Free',
    isFree: true,
    description: 'An award-winning interactive portfolio for product designers, creative directors, and digital artists.',
    image: '/assets/templates/creative-portfolio.svg',
    featured: false,
    rating: 4.9,
    downloads: 2310,
    tags: ['UI/UX', 'Portfolio', 'Case Studies', 'Awwwards']
  },
  {
    id: 'tpl-5',
    name: 'Nexus AI Agency',
    category: 'Agency',
    price: '$69',
    isFree: false,
    description: 'High-conversion agency template for B2B SaaS consultants, AI automation agencies, and tech studios.',
    image: '/assets/templates/digital-agency.svg',
    featured: true,
    rating: 5.0,
    downloads: 1650,
    tags: ['SaaS', 'AI Agency', 'Workflow', 'B2B']
  },
  {
    id: 'tpl-6',
    name: 'Velour Streetwear',
    category: 'E-commerce',
    price: '$54',
    isFree: false,
    description: 'Bold, typography-driven fashion store with lookbooks, instant cart drawer, and seasonal drop countdowns.',
    image: '/assets/templates/fashion-store.svg',
    featured: false,
    rating: 4.7,
    downloads: 1120,
    tags: ['Fashion', 'Apparel', 'Streetwear', 'Cart Drawer']
  },
  {
    id: 'tpl-7',
    name: 'Mastery Code Academy',
    category: 'Education',
    price: 'Free',
    isFree: true,
    description: 'Comprehensive course catalog, cohort learning paths, video player integration, and student testimonials.',
    image: '/assets/templates/education-academy.svg',
    featured: false,
    rating: 4.85,
    downloads: 1890,
    tags: ['Courses', 'LMS', 'Bootcamp', 'Certificates']
  },
  {
    id: 'tpl-8',
    name: 'Haven Luxury Realty',
    category: 'Real Estate',
    price: '$79',
    isFree: false,
    description: 'Ultra-luxury waterfront villas, 3D virtual tour embeds, interactive property specs, and agent direct connect.',
    image: '/assets/templates/real-estate-estate.svg',
    featured: true,
    rating: 4.9,
    downloads: 740,
    tags: ['Luxury Villas', 'Listings', 'Floor Plans', 'Realtor']
  }
];
