import { config } from '../config';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  provider: 'gemini' | 'openai' | 'webcraft-engine';
  sessionId?: string;
  timestamp: string;
}

export class AIService {
  /**
   * Main chat processing pipeline
   */
  public async generateResponse(request: ChatRequest): Promise<ChatResponse> {
    const { messages, sessionId } = request;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages list cannot be empty.');
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage.content || lastMessage.content.trim() === '') {
      throw new Error('Message content cannot be blank.');
    }

    // 1. Try Gemini Provider if configured
    if (config.geminiApiKey) {
      try {
        const geminiReply = await this.callGemini(messages);
        if (geminiReply) {
          return {
            reply: geminiReply,
            provider: 'gemini',
            sessionId,
            timestamp: new Date().toISOString()
          };
        }
      } catch (err: any) {
        console.warn('Gemini API request failed, falling back to backup engine:', err?.message || err);
      }
    }

    // 2. Try OpenAI Provider if configured
    if (config.openaiApiKey) {
      try {
        const openaiReply = await this.callOpenAI(messages);
        if (openaiReply) {
          return {
            reply: openaiReply,
            provider: 'openai',
            sessionId,
            timestamp: new Date().toISOString()
          };
        }
      } catch (err: any) {
        console.warn('OpenAI API request failed, falling back to backup engine:', err?.message || err);
      }
    }

    // 3. Fallback to WebCraftAI contextual website intelligence engine
    const engineReply = this.generateWebCraftEngineResponse(messages);
    return {
      reply: engineReply,
      provider: 'webcraft-engine',
      sessionId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Call Gemini 2.0 / 1.5 Flash via REST API with multi-turn history
   */
  private async callGemini(messages: ChatMessage[]): Promise<string> {
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: config.systemInstruction }]
      },
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API returned status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data: any = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Gemini API returned an empty candidate text.');
    }

    return text;
  }

  /**
   * Call OpenAI Chat Completion API with multi-turn history
   */
  private async callOpenAI(messages: ChatMessage[]): Promise<string> {
    const apiMessages = [
      { role: 'system', content: config.systemInstruction },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API returned status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data: any = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error('OpenAI API returned an empty reply.');
    }

    return reply;
  }

  /**
   * Smart, conversational fallback engine that remembers context across turns
   */
  private generateWebCraftEngineResponse(messages: ChatMessage[]): string {
    const fullConversationText = messages.map(m => m.content.toLowerCase()).join(' ');
    const latestUserMsg = messages[messages.length - 1].content.trim();
    const lowerLatest = latestUserMsg.toLowerCase();

    // Check conversational context
    const isFurniture = fullConversationText.includes('furniture');
    const isBeauty = fullConversationText.includes('beauty') || fullConversationText.includes('cosmetic') || fullConversationText.includes('skincare');
    const isRestaurant = fullConversationText.includes('restaurant') || fullConversationText.includes('food') || fullConversationText.includes('cafe');
    const isPortfolio = fullConversationText.includes('portfolio') || fullConversationText.includes('personal') || fullConversationText.includes('resume');
    const isEcommerce = fullConversationText.includes('store') || fullConversationText.includes('shop') || fullConversationText.includes('ecommerce') || fullConversationText.includes('clothing');
    const isAgency = fullConversationText.includes('agency') || fullConversationText.includes('marketing') || fullConversationText.includes('consulting');

    // Follow-up queries (e.g. "Add Home, Products and Contact pages", "Make the colors beige and dark brown", etc.)
    const isColorFollowUp = lowerLatest.includes('color') || lowerLatest.includes('beige') || lowerLatest.includes('brown') || lowerLatest.includes('palette') || lowerLatest.includes('theme');
    const isPageFollowUp = lowerLatest.includes('page') || lowerLatest.includes('section') || lowerLatest.includes('add home') || lowerLatest.includes('structure');

    if (isFurniture) {
      if (isColorFollowUp) {
        return `### 🎨 Color Palette & Aesthetic Configuration for Your Furniture Website

That warm, organic neutral palette with **beige (#F5F0EA)**, **dark brown / espresso (#3D2B1F)**, and **crisp warm white (#FAF9F6)** will give your furniture store a timeless, high-end Scandinavian or mid-century modern look!

Here is how we can apply this across the website:

1. **Primary Backgrounds**: Soft Warm Alabaster (\`#FAF9F6\`) for clean readability and breathable whitespace.
2. **Text & Headings**: Deep Espresso (\`#3D2B1F\`) for rich contrast and elegant typography.
3. **Accent Elements & Cards**: Warm Oat / Sand Beige (\`#E8DFD5\`) for product cards, category pills, and backdrop highlights.
4. **Primary CTAs & Action Buttons**: Rich Cognac Brown (\`#6F4E37\`) with white hover states.

#### Recommended Typography:
- **Headings**: *Playfair Display* or *Cinzel* (refined luxury serif)
- **Body & Product Specs**: *Inter* or *Plus Jakarta Sans* (ultra-clean, legible modern sans-serif)

Would you like me to organize the layout structure for the **Hero Showcase**, **Featured Collections**, and **3D Room Visualizer** next?`;
      }

      if (isPageFollowUp) {
        return `### 📐 Site Architecture & Page Layout Plan

Understood! Let's structure your **Furniture Website** with the recommended pages and section breakdown:

#### 1. **Home Page**
- **Hero Section**: High-impact editorial imagery with headline ("Crafted for Modern Living"), subheadline, and primary CTA ("Explore Collection").
- **Featured Categories**: Living Room, Dining, Bedroom, Lighting & Decor with interactive hover states.
- **Craftsmanship / Story Highlight**: Video/story snippet showcasing materials (solid oak, sustainably sourced walnut).
- **Best Sellers Grid**: Filterable by wood finish, room, and price with quick-view modal.
- **Customer Testimonials & Press Logos**: Social proof slider.
- **Footer**: Newsletter subscription (10% off first order), store locator, and customer service links.

#### 2. **Products / Catalog Page**
- Multi-faceted sidebar filtering (Room, Material, Price, In-Stock status).
- High-res product cards with secondary image hover, price, and "Add to Cart" / "Custom Inquiry" action.

#### 3. **Contact & Showroom Page**
- Interactive appointment booking form for design consultations.
- Showroom map, operating hours, and direct concierge contact.

Would you like me to recommend specific e-commerce checkout features or help you choose a matching template?`;
      }

      return `### 🛋️ Furniture Website Blueprint & Strategic Design Plan

Welcome! A professional furniture website needs to convey elegance, craftsmanship, and tactile material quality through clean layout and generous whitespace.

Here is my recommended blueprint for your furniture website:

#### 1. Recommended Color Palette
- **Primary Color**: Deep Espresso (\`#3D2B1F\`) or Charcoal Wood (\`#22252A\`)
- **Secondary Accent**: Warm Oat / Beige (\`#F5F0EA\`)
- **Warm Highlight**: Terracotta or Rich Cognac (\`#C06B3E\`)
- **Base Background**: Pure Crisp Linen (\`#FCFBF9\`)

#### 2. Recommended Structure & Pages
- **Home**: Editorial hero banner, curated collections, material craftsmanship spotlight, client reviews.
- **Products Catalog**: Filterable catalog with high-resolution gallery zoom and dimensions guide.
- **Lookbook / Spaces**: Room-by-room inspiration gallery.
- **About / Heritage**: Story of design philosophy and sustainable sourcing.
- **Contact & Studio Booking**: Consultation scheduler and contact details.

#### 3. Essential UX Features
- High-resolution zoom and multi-angle product photography.
- Material/fabric selector swatch preview.
- "Shop the Look" interactive hotspots.

Would you like to customize the color palette, or focus on specific pages and features next?`;
    }

    if (isBeauty) {
      return `### ✨ Beauty & Skincare Website Architecture Plan

Creating a beauty website requires a vibrant, clean, and trustworthy aesthetic that emphasizes ingredients, dermatological safety, and radiant imagery.

#### 1. Recommended Color Palette
- **Primary / Brand**: Soft Blush Rose (\`#F4E2DE\`) or Radiant Peach (\`#FBE9E7\`)
- **Text & Accents**: Rich Plum Berry (\`#2E1A2B\`) or Deep Charcoal
- **Subtle Highlight**: Rose Gold (\`#B76E79\`)
- **Background**: Pure Dewy White (\`#FFFFFF\`)

#### 2. Core Site Pages & Sections
- **Home Page**: Hero video/banner, "Clinically Proven" stats banner, best-selling serums/products, skin routine quiz CTA.
- **Shop All**: Filter by Skin Type (Dry, Oily, Sensitive, Combination), Concern, and Routine step.
- **Ingredients Glossary**: Transparent breakdown of active ingredients (Hyaluronic acid, Niacinamide, Vitamin C).
- **Reviews & Before/Afters**: Photo-verified customer results.
- **Contact & FAQ**: Shipping, returns, and skin consultation support.

Would you like to explore layout options for your skincare product catalog or checkout flow?`;
    }

    if (isRestaurant) {
      return `### 🍽️ Restaurant & Culinary Website Design Plan

For a dining establishment, the website should stimulate appetite, make reservations effortless, and showcase the ambiance and menu artistry.

#### 1. Recommended Color Palette
- **Primary**: Deep Truffle / Charcoal (\`#1A1A1A\`)
- **Accent**: Warm Amber Gold (\`#D4AF37\`) or Terracotta Wine (\`#9E2A2B\`)
- **Background**: Rich Cream (\`#FAF8F5\`)

#### 2. Recommended Pages & Flow
- **Home**: Atmosphere video hero, chef's introduction, quick "Book a Table" bar, signature dishes carousel.
- **Interactive Menu**: Categorized (Starters, Mains, Desserts, Wines) with dietary badges (Vegan, Gluten-Free, Halal).
- **Reservation System**: Direct integration for date, time, party size, and special requests.
- **Location & Hours**: Live map, parking notes, private dining contact.

Would you like to discuss online ordering capabilities or private event catering sections?`;
    }

    // General professional response
    return `### 🚀 WebCraftAI Website Plan & Recommendations

Thank you for sharing your vision! Here is a tailored architectural recommendation to help you design and build a high-converting, beautiful website:

#### 1. Page Hierarchy & Layout
- **Hero Section**: Compelling value proposition headline, descriptive subheading, social proof badges, and a prominent primary Call-to-Action.
- **Features / Services Grid**: 3-4 clear benefit columns highlighting what sets your brand apart.
- **Showcase / Portfolio Gallery**: Interactive cards with high-resolution visual previews and category filtering.
- **Testimonials & Trust Signals**: Customer quotes, partner logos, and satisfaction guarantees.
- **Lead Capture & Contact**: Streamlined contact form with minimal friction.

#### 2. Suggested Color Scheme & Typography
- **Primary Color**: Modern Indigo/Violet (\`#6366F1\`)
- **Accent Color**: Vivid Cyan/Sky (\`#0EA5E9\`)
- **Background**: Clean Light Gray/White (\`#F8FAFC\`)
- **Typography**: *Inter* for clean UI body text paired with *Outfit* or *Cabinet Grotesk* for bold headlines.

What specific niche, industry, or preferred color theme would you like to focus on next?`;
  }
}

export const aiService = new AIService();
