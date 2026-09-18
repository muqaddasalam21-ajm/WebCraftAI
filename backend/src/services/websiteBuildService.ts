/**
 * Phase 14 — Website Build Service
 * Converts a WebsiteSpecification into a deployable HTML/CSS/JS artifact.
 * The output is self-contained static HTML — no framework dependencies.
 */

import path from 'path';
import fs from 'fs';
import { WebsiteSpecification } from '../models/websiteSpecificationSchema';
import { WebsiteBuildArtifact } from './deploymentProvider';

const BUILDS_DIR = path.join(__dirname, '../../builds');

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sanitizeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates the complete static HTML from a WebsiteSpecification.
 */
function generateHtml(spec: WebsiteSpecification): string {
  const title = sanitizeHtml(spec.title || spec.businessName || 'My Website');
  const primaryColor = spec.colors?.primary || '#16a34a';
  const secondaryColor = spec.colors?.secondary || '#15803d';
  const bgColor = spec.colors?.background || '#ffffff';
  const textColor = spec.colors?.text || '#1f2937';
  const accentColor = spec.colors?.accent || '#4ade80';
  const headingFont = spec.typography?.headingFont || 'Inter, sans-serif';
  const bodyFont = spec.typography?.bodyFont || 'Inter, sans-serif';
  const description = sanitizeHtml(spec.description || '');
  const businessName = sanitizeHtml(spec.businessName || title);

  // Build navigation
  const navLinks = (spec.navigation || []).map(nav =>
    `<a href="#${sanitizeHtml(nav.pageId || nav.label.toLowerCase())}" class="nav-link">${sanitizeHtml(nav.label)}</a>`
  ).join('\n        ');

  // Build page sections
  const sectionHtml = buildSections(spec);

  // Build footer
  const footerContent = typeof spec.footer === 'object' && spec.footer !== null
    ? sanitizeHtml((spec.footer as unknown as Record<string, unknown>)?.text as string || (spec.footer as unknown as Record<string, unknown>)?.copyright as string || '') || `&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.`
    : `&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.`;

  const seoTitle = sanitizeHtml(spec.seo?.title || title);
  const seoDescription = sanitizeHtml(spec.seo?.description || description);
  const seoKeywords = (spec.seo?.keywords || []).join(', ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoTitle}</title>
  <meta name="description" content="${seoDescription}">
  <meta name="keywords" content="${sanitizeHtml(seoKeywords)}">
  <meta property="og:title" content="${seoTitle}">
  <meta property="og:description" content="${seoDescription}">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Navigation -->
  <nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="container nav-container">
      <a href="#" class="brand" aria-label="${businessName} - Home">
        <span class="brand-name">${businessName}</span>
      </a>
      <div class="nav-links" role="menubar">
        ${navLinks || `<a href="#home" class="nav-link">Home</a>`}
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <main id="main-content" role="main">
${sectionHtml}
  </main>

  <!-- Footer -->
  <footer class="site-footer" role="contentinfo">
    <div class="container">
      <p>${footerContent}</p>
    </div>
  </footer>

  <script src="main.js"></script>
</body>
</html>`;
}

function buildSections(spec: WebsiteSpecification): string {
  const sections = spec.sections || [];
  if (sections.length === 0) {
    return buildDefaultHeroSection(spec);
  }

  return sections
    .filter(s => s.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(section => buildSection(section, spec))
    .join('\n');
}

function buildDefaultHeroSection(spec: WebsiteSpecification): string {
  const title = sanitizeHtml(spec.title || spec.businessName || 'Welcome');
  const desc = sanitizeHtml(spec.description || '');
  return `    <section class="hero section" id="home">
      <div class="container hero-content">
        <h1 class="hero-title">${title}</h1>
        ${desc ? `<p class="hero-subtitle">${desc}</p>` : ''}
        <a href="#contact" class="btn btn-primary">Get Started</a>
      </div>
    </section>`;
}

function buildSection(section: WebsiteSpecification['sections'][0], spec: WebsiteSpecification): string {
  const type = section.type?.toUpperCase() || 'TEXT';
  const sectionId = sanitizeHtml(section.id || type.toLowerCase());
  const content = section.content || {};

  switch (type) {
    case 'HERO':
      return `    <section class="hero section" id="${sectionId}">
      <div class="container hero-content">
        <h1 class="hero-title">${sanitizeHtml((content as Record<string, unknown>)?.heading as string || spec.title || spec.businessName || 'Welcome')}</h1>
        <p class="hero-subtitle">${sanitizeHtml((content as Record<string, unknown>)?.subheading as string || spec.description || '')}</p>
        <div class="hero-actions">
          <a href="#contact" class="btn btn-primary">${sanitizeHtml((content as Record<string, unknown>)?.primaryCtaLabel as string || 'Get Started')}</a>
          <a href="#about" class="btn btn-secondary">${sanitizeHtml((content as Record<string, unknown>)?.secondaryCtaLabel as string || 'Learn More')}</a>
        </div>
      </div>
    </section>`;

    case 'ABOUT':
      return `    <section class="about section bg-light" id="${sectionId}">
      <div class="container">
        <h2 class="section-title">${sanitizeHtml((content as Record<string, unknown>)?.heading as string || 'About Us')}</h2>
        <p class="section-text">${sanitizeHtml((content as Record<string, unknown>)?.body as string || '')}</p>
      </div>
    </section>`;

    case 'SERVICES':
    case 'FEATURES':
      return `    <section class="services section" id="${sectionId}">
      <div class="container">
        <h2 class="section-title">${sanitizeHtml((content as Record<string, unknown>)?.heading as string || type === 'SERVICES' ? 'Our Services' : 'Features')}</h2>
        <div class="cards-grid">
          ${buildCardItems(content)}
        </div>
      </div>
    </section>`;

    case 'CONTACT':
      return `    <section class="contact section bg-light" id="${sectionId}">
      <div class="container">
        <h2 class="section-title">${sanitizeHtml((content as Record<string, unknown>)?.heading as string || 'Contact Us')}</h2>
        <form class="contact-form" action="#" method="post" novalidate>
          <div class="form-group"><label for="name">Name</label><input type="text" id="name" name="name" required placeholder="Your name"></div>
          <div class="form-group"><label for="email">Email</label><input type="email" id="email" name="email" required placeholder="your@email.com"></div>
          <div class="form-group"><label for="message">Message</label><textarea id="message" name="message" rows="5" required placeholder="How can we help?"></textarea></div>
          <button type="submit" class="btn btn-primary">Send Message</button>
        </form>
      </div>
    </section>`;

    case 'TESTIMONIALS':
      return `    <section class="testimonials section" id="${sectionId}">
      <div class="container">
        <h2 class="section-title">${sanitizeHtml((content as Record<string, unknown>)?.heading as string || 'What Our Clients Say')}</h2>
        <div class="testimonials-grid">
          ${buildTestimonialItems(content)}
        </div>
      </div>
    </section>`;

    case 'CTA':
      return `    <section class="cta-section section" id="${sectionId}">
      <div class="container cta-content">
        <h2 class="cta-title">${sanitizeHtml((content as Record<string, unknown>)?.heading as string || 'Ready to Get Started?')}</h2>
        <p class="cta-text">${sanitizeHtml((content as Record<string, unknown>)?.body as string || '')}</p>
        <a href="#contact" class="btn btn-primary btn-large">${sanitizeHtml((content as Record<string, unknown>)?.ctaLabel as string || 'Contact Us')}</a>
      </div>
    </section>`;

    case 'STATS':
      return `    <section class="stats section bg-primary" id="${sectionId}">
      <div class="container">
        <div class="stats-grid">
          ${buildStatItems(content)}
        </div>
      </div>
    </section>`;

    default:
      return `    <section class="section bg-light" id="${sectionId}">
      <div class="container">
        <h2 class="section-title">${sanitizeHtml((content as Record<string, unknown>)?.heading as string || type)}</h2>
        <p class="section-text">${sanitizeHtml((content as Record<string, unknown>)?.body as string || (content as Record<string, unknown>)?.text as string || '')}</p>
      </div>
    </section>`;
  }
}

function buildCardItems(content: unknown): string {
  const c = content as Record<string, unknown>;
  const items = Array.isArray(c?.items) ? c.items as Array<Record<string, unknown>> : [];
  if (items.length === 0) {
    return '<div class="card"><h3>Our Service</h3><p>Contact us to learn more.</p></div>';
  }
  return items.map(item =>
    `<div class="card">
            ${item.icon ? `<div class="card-icon">${sanitizeHtml(item.icon as string)}</div>` : ''}
            <h3>${sanitizeHtml(item.title as string || '')}</h3>
            <p>${sanitizeHtml(item.description as string || '')}</p>
            ${item.price ? `<div class="card-price">${sanitizeHtml(item.price as string)}</div>` : ''}
          </div>`
  ).join('\n          ');
}

function buildTestimonialItems(content: unknown): string {
  const c = content as Record<string, unknown>;
  const items = Array.isArray(c?.items) ? c.items as Array<Record<string, unknown>> : [];
  if (items.length === 0) {
    return '<div class="testimonial-card"><blockquote>Excellent service!</blockquote><cite>— Satisfied Customer</cite></div>';
  }
  return items.map(item =>
    `<div class="testimonial-card">
            <blockquote>"${sanitizeHtml(item.quote as string || item.text as string || '')}"</blockquote>
            <cite>— ${sanitizeHtml(item.author as string || item.name as string || 'Client')}</cite>
          </div>`
  ).join('\n          ');
}

function buildStatItems(content: unknown): string {
  const c = content as Record<string, unknown>;
  const items = Array.isArray(c?.items) ? c.items as Array<Record<string, unknown>> : [];
  if (items.length === 0) return '';
  return items.map(item =>
    `<div class="stat-item">
            <div class="stat-value">${sanitizeHtml(item.value as string || '')}</div>
            <div class="stat-label">${sanitizeHtml(item.label as string || '')}</div>
          </div>`
  ).join('\n          ');
}

function generateCss(spec: WebsiteSpecification): string {
  const primaryColor = spec.colors?.primary || '#16a34a';
  const secondaryColor = spec.colors?.secondary || '#15803d';
  const bgColor = spec.colors?.background || '#ffffff';
  const textColor = spec.colors?.text || '#1f2937';
  const accentColor = spec.colors?.accent || '#4ade80';
  const headingFont = spec.typography?.headingFont || 'Inter, sans-serif';
  const bodyFont = spec.typography?.bodyFont || 'Inter, sans-serif';

  return `/* Generated by WebCraftAI — Phase 14 */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --primary: ${primaryColor};
  --secondary: ${secondaryColor};
  --bg: ${bgColor};
  --text: ${textColor};
  --accent: ${accentColor};
  --heading-font: ${headingFont};
  --body-font: ${bodyFont};
  --radius: 0.75rem;
  --shadow: 0 4px 24px rgba(0,0,0,0.08);
}
html { scroll-behavior: smooth; }
body { font-family: var(--body-font); color: var(--text); background: var(--bg); line-height: 1.7; -webkit-font-smoothing: antialiased; }
h1,h2,h3,h4,h5,h6 { font-family: var(--heading-font); font-weight: 700; line-height: 1.25; }
a { color: var(--primary); text-decoration: none; transition: color 0.2s; }
a:hover { color: var(--secondary); }
img { max-width: 100%; height: auto; display: block; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
.section { padding: 5rem 0; }
.bg-light { background: #f9fafb; }
.bg-primary { background: var(--primary); color: #fff; }
.section-title { font-size: clamp(1.75rem, 4vw, 2.75rem); margin-bottom: 1.25rem; text-align: center; }
.section-text { font-size: 1.125rem; max-width: 700px; margin: 0 auto; text-align: center; color: #6b7280; }

/* Navbar */
.navbar { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(0,0,0,0.08); }
.nav-container { display: flex; align-items: center; justify-content: space-between; height: 4rem; }
.brand-name { font-size: 1.25rem; font-weight: 800; color: var(--primary); }
.nav-links { display: flex; gap: 2rem; align-items: center; }
.nav-link { font-weight: 500; font-size: 0.9rem; color: var(--text); transition: color 0.2s; }
.nav-link:hover { color: var(--primary); }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.75rem; border-radius: var(--radius); font-weight: 600; font-size: 0.95rem; cursor: pointer; border: none; transition: all 0.2s; text-decoration: none; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--secondary); color: #fff; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
.btn-secondary { background: transparent; color: var(--primary); border: 2px solid var(--primary); }
.btn-secondary:hover { background: var(--primary); color: #fff; }
.btn-large { padding: 1rem 2.5rem; font-size: 1.05rem; }

/* Hero */
.hero { background: linear-gradient(135deg, ${primaryColor}15 0%, ${accentColor}10 100%); min-height: 90vh; display: flex; align-items: center; }
.hero-content { text-align: center; max-width: 800px; margin: 0 auto; }
.hero-title { font-size: clamp(2.5rem, 6vw, 4rem); margin-bottom: 1.5rem; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero-subtitle { font-size: clamp(1rem, 2.5vw, 1.3rem); color: #6b7280; margin-bottom: 2.5rem; }
.hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

/* Cards */
.cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
.card { background: #fff; border-radius: var(--radius); padding: 2rem; box-shadow: var(--shadow); border: 1px solid rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; }
.card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); }
.card h3 { font-size: 1.2rem; margin-bottom: 0.75rem; color: var(--primary); }
.card-icon { font-size: 2rem; margin-bottom: 1rem; }
.card-price { margin-top: 1rem; font-weight: 700; color: var(--primary); font-size: 1.1rem; }

/* Testimonials */
.testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
.testimonial-card { background: #fff; border-radius: var(--radius); padding: 2rem; box-shadow: var(--shadow); border-left: 4px solid var(--primary); }
.testimonial-card blockquote { font-size: 1.05rem; font-style: italic; color: #374151; margin-bottom: 1rem; }
.testimonial-card cite { font-weight: 600; color: var(--primary); font-style: normal; }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; text-align: center; }
.stat-value { font-size: 3rem; font-weight: 800; color: #fff; }
.stat-label { font-size: 1rem; color: rgba(255,255,255,0.85); margin-top: 0.5rem; }

/* CTA */
.cta-section { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; }
.cta-content { text-align: center; }
.cta-title { font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 1rem; color: #fff; }
.cta-text { font-size: 1.125rem; color: rgba(255,255,255,0.9); margin-bottom: 2rem; }

/* Contact */
.contact-form { max-width: 600px; margin: 2rem auto 0; display: flex; flex-direction: column; gap: 1.25rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-weight: 600; font-size: 0.9rem; }
.form-group input, .form-group textarea { padding: 0.75rem 1rem; border: 2px solid #e5e7eb; border-radius: var(--radius); font-size: 1rem; font-family: inherit; transition: border-color 0.2s; }
.form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); }

/* About */
.about .section-text { font-size: 1.15rem; line-height: 1.8; }

/* Footer */
.site-footer { background: #111827; color: #9ca3af; padding: 2rem 0; text-align: center; font-size: 0.9rem; }

/* Responsive */
@media (max-width: 768px) {
  .nav-links { display: none; }
  .hero-actions { flex-direction: column; align-items: center; }
  .section { padding: 3rem 0; }
}`;
}

function generateJs(): string {
  return `/* Generated by WebCraftAI — Phase 14 */
(function() {
  'use strict';

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Contact form submission
  var form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Message Sent!';
        btn.disabled = true;
        setTimeout(function() { btn.textContent = 'Send Message'; btn.disabled = false; }, 3000);
      }
    });
  }

  // Intersection Observer for section animations
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section').forEach(function(el) {
      observer.observe(el);
    });
  }
})();`;
}

/**
 * Validates a WebsiteSpecification before building.
 */
export function validateSpecForBuild(spec: WebsiteSpecification): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!spec.id) errors.push('Specification is missing an id.');
  if (!spec.businessName && !spec.title) errors.push('Specification must have a businessName or title.');
  if (!spec.pages || spec.pages.length === 0) {
    // Not fatal — will generate default page
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Builds a complete static website artifact from a WebsiteSpecification.
 * All output files are in-memory + written to disk under builds/<deploymentId>/
 */
export async function buildWebsiteArtifact(
  spec: WebsiteSpecification,
  deploymentId: string
): Promise<WebsiteBuildArtifact> {
  const buildDir = path.join(BUILDS_DIR, deploymentId);
  ensureDir(buildDir);

  const html = generateHtml(spec);
  const css = generateCss(spec);
  const js = generateJs();

  // Write files to disk
  fs.writeFileSync(path.join(buildDir, 'index.html'), html, 'utf8');
  fs.writeFileSync(path.join(buildDir, 'styles.css'), css, 'utf8');
  fs.writeFileSync(path.join(buildDir, 'main.js'), js, 'utf8');

  const files: Record<string, string> = {
    'index.html': html,
    'styles.css': css,
    'main.js': js
  };

  const sizeBytes = Object.values(files).reduce((acc, content) => acc + Buffer.byteLength(content, 'utf8'), 0);

  console.log(`[BuildService] Built artifact for deployment ${deploymentId}: ${sizeBytes} bytes, ${Object.keys(files).length} files`);

  return {
    buildPath: buildDir,
    files,
    sizeBytes
  };
}
