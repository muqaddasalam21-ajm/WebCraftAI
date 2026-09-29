import { PaymentProvider } from './types';
import { easypaisaProvider } from './easypaisaProvider';
import { jazzcashProvider } from './jazzcashProvider';
import { cardPaymentProvider } from './cardPaymentProvider';
import { PaymentConfigResponse } from '../../models/payment';

export * from './types';
export * from './easypaisaProvider';
export * from './jazzcashProvider';
export * from './cardPaymentProvider';

class PaymentProviderRegistry {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor() {
    this.register(easypaisaProvider);
    this.register(jazzcashProvider);
    this.register(cardPaymentProvider);
  }

  public register(provider: PaymentProvider) {
    this.providers.set(provider.name, provider);
  }

  public get(name: string): PaymentProvider | undefined {
    return this.providers.get(name);
  }

  public getAll(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Returns safe public configuration for frontend checkout.
   * NEVER exposes secret keys, hash keys, or passwords.
   */
  public getSafePublicConfig(): PaymentConfigResponse {
    return {
      providers: {
        easypaisa: {
          configured: easypaisaProvider.isConfigured,
          status: easypaisaProvider.isConfigured ? 'CONFIGURED' : 'CONFIGURATION_REQUIRED',
          environment: easypaisaProvider.environment,
          displayName: easypaisaProvider.displayName,
          badge: easypaisaProvider.badge,
          description: easypaisaProvider.isConfigured
            ? 'Direct Easypaisa Mobile Account / OTC'
            : 'Merchant activation required'
        },
        jazzcash: {
          configured: jazzcashProvider.isConfigured,
          status: jazzcashProvider.isConfigured ? 'CONFIGURED' : 'CONFIGURATION_REQUIRED',
          environment: jazzcashProvider.environment,
          displayName: jazzcashProvider.displayName,
          badge: jazzcashProvider.badge,
          description: jazzcashProvider.isConfigured
            ? 'JazzCash Mobile Account / Voucher'
            : 'Merchant activation required'
        },
        card: {
          configured: cardPaymentProvider.isConfigured,
          status: cardPaymentProvider.isConfigured ? 'CONFIGURED' : 'CONFIGURATION_REQUIRED',
          environment: cardPaymentProvider.environment,
          displayName: cardPaymentProvider.displayName,
          badge: cardPaymentProvider.badge,
          description: cardPaymentProvider.isConfigured
            ? 'Secure 3D-Secure Credit / Debit Card'
            : 'Merchant activation required'
        }
      }
    };
  }
}

export const providerRegistry = new PaymentProviderRegistry();
