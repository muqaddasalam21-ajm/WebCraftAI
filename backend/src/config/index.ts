import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  jwtSecret: process.env.JWT_SECRET || 'webcraftai-super-secret-jwt-key-2026-production-ready',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  systemInstruction: `You are WebCraftAI, an expert AI website-building assistant. Help users plan, design and customize professional websites. Understand their website requirements and provide practical recommendations including:
- Website structure & page hierarchy
- Recommended color palettes (primary, secondary, accent, background)
- Typography pairings (headings & body)
- Key layout sections (Hero, Value Proposition, Features, Social Proof, Gallery/Products, Pricing, FAQs, CTA, Footer)
- Conversion optimization & UX recommendations
- Practical design considerations

Ask useful clarification questions when needed. Never claim that a website has been created, published, purchased, deployed, or modified unless the application actually performed that action.`,

  // External Payment Integration Configuration
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  paymentMode: (process.env.PAYMENT_PROVIDER_MODE as 'sandbox' | 'production') || 'sandbox',
  easypaisa: {
    storeId: process.env.EASYPAISA_STORE_ID || '',
    hashKey: process.env.EASYPAISA_HASH_KEY || '',
    accountNum: process.env.EASYPAISA_ACCOUNT_NUM || '',
    password: process.env.EASYPAISA_PASSWORD || '',
    mode: (process.env.EASYPAISA_MODE as 'sandbox' | 'production') || 'sandbox'
  },
  jazzcash: {
    merchantId: process.env.JAZZCASH_MERCHANT_ID || '',
    password: process.env.JAZZCASH_PASSWORD || '',
    integritySalt: process.env.JAZZCASH_INTEGRITY_SALT || '',
    returnUrl: process.env.JAZZCASH_RETURN_URL || '',
    mode: (process.env.JAZZCASH_MODE as 'sandbox' | 'production') || 'sandbox'
  },
  cardGateway: {
    provider: process.env.CARD_GATEWAY_PROVIDER || 'hblpay',
    merchantId: process.env.CARD_GATEWAY_MERCHANT_ID || '',
    accessKey: process.env.CARD_GATEWAY_ACCESS_KEY || '',
    secretKey: process.env.CARD_GATEWAY_SECRET_KEY || '',
    profileId: process.env.CARD_GATEWAY_PROFILE_ID || '',
    mode: (process.env.CARD_GATEWAY_MODE as 'sandbox' | 'production') || 'sandbox'
  }
};
