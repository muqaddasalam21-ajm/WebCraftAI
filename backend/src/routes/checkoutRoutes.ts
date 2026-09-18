import { Router, Response, Request } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { orderDb } from '../data/orderStore';
import { templateDb } from '../data/templateStore';
import { productDb } from '../data/productStore';
import { servicePackageDb } from '../data/servicePackageStore';
import { paymentDb } from '../data/paymentStore';
import { paymentGateway } from '../services/paymentProvider';
import { notificationDb } from '../data/notificationStore';
import { auditDb } from '../data/auditStore';
import { eventBus } from '../events/eventBus';
import { CheckoutSummary, PaymentMethod } from '../models/payment';

export const checkoutRouter = Router();

// POST /api/checkout/summary - Calculate trusted server-side order summary
checkoutRouter.post('/summary', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const { orderId, itemType, itemId, quantity } = req.body;

    // Case 1: Existing Order lookup
    if (orderId) {
      const order = orderDb.findById(orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }

      // Security check: only order owner or privileged staff can inspect checkout summary
      if (user.role !== 'admin' && user.role !== 'manager' && order.customerId !== user.id) {
        res.status(403).json({ error: 'Forbidden: You do not have permission to checkout this order.' });
        return;
      }

      const itemName = order.type === 'custom_website'
        ? (order.package?.packageName || 'Custom Website Build')
        : order.type === 'template'
        ? (order.templateDetails?.templateName || 'Marketplace Template')
        : (order.productDetails?.productName || 'Catalog Product');

      const summary: CheckoutSummary = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        itemType: order.type,
        itemId: order.package?.packageId || order.templateDetails?.templateId || order.productDetails?.productId || order.id,
        itemName,
        itemDescription: order.businessInfo?.businessDescription || `Purchase of ${itemName}`,
        subtotal: order.amount,
        tax: 0,
        fees: 0,
        total: order.amount,
        currency: order.package?.currency || 'USD',
        customer: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };

      res.json({ summary, isPaid: order.paymentStatus === 'PAID' });
      return;
    }

    // Case 2: Prospective Item lookup (package, template, or product)
    if (!itemType || !itemId) {
      res.status(400).json({ error: 'Either orderId or (itemType and itemId) must be provided.' });
      return;
    }

    let itemName = '';
    let itemDescription = '';
    let trustedPrice = 0;
    const qty = Math.max(1, quantity || 1);

    if (itemType === 'template') {
      const tpl = templateDb.findById(itemId);
      if (!tpl || tpl.status !== 'PUBLISHED') {
        res.status(404).json({ error: 'Template not found or not published.' });
        return;
      }
      itemName = tpl.name;
      itemDescription = tpl.description;
      trustedPrice = tpl.price;
    } else if (itemType === 'product') {
      const prd = productDb.findById(itemId);
      if (!prd || prd.status !== 'published') {
        res.status(404).json({ error: 'Product not found or not published.' });
        return;
      }
      itemName = prd.name;
      itemDescription = prd.description;
      trustedPrice = Math.round((prd.price * qty) * 100) / 100;
    } else if (itemType === 'custom_website') {
      const pkg = servicePackageDb.getById(itemId);
      if (!pkg || !pkg.isActive) {
        res.status(404).json({ error: 'Service package not found or inactive.' });
        return;
      }
      itemName = pkg.name;
      itemDescription = pkg.description;
      trustedPrice = pkg.price;
    } else {
      res.status(400).json({ error: 'Invalid itemType.' });
      return;
    }

    const summary: CheckoutSummary = {
      itemType,
      itemId,
      itemName,
      itemDescription,
      subtotal: trustedPrice,
      tax: 0,
      fees: 0,
      total: trustedPrice,
      currency: 'USD',
      customer: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

    res.json({ summary, isPaid: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate checkout summary.' });
  }
});

// POST /api/checkout/initiate - Initialize payment session for an order
checkoutRouter.post('/initiate', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { orderId, itemType, itemId, quantity, paymentMethod } = req.body;

    let targetOrder = orderId ? orderDb.findById(orderId) : undefined;

    // If no existing order, automatically create one securely from trusted catalog
    if (!targetOrder) {
      if (orderId) {
        res.status(404).json({ error: `Order with ID ${orderId} not found.` });
        return;
      }
      if (!itemType || !itemId) {
        res.status(400).json({ error: 'Either orderId or (itemType and itemId) is required.' });
        return;
      }

      if (itemType === 'template') {
        targetOrder = orderDb.createTemplateOrder({
          customerId: user.id,
          customerName: user.name,
          customerEmail: user.email,
          templateId: itemId
        });
      } else if (itemType === 'product') {
        targetOrder = orderDb.createProductOrder({
          customerId: user.id,
          customerName: user.name,
          customerEmail: user.email,
          productId: itemId,
          quantity
        });
      } else {
        res.status(400).json({ error: 'Custom website builds must be configured via service order builder.' });
        return;
      }
    }

    // Security check: Only customer who owns order can initiate payment
    if (user.role !== 'admin' && user.role !== 'manager' && targetOrder.customerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not own this order.' });
      return;
    }

    // Check if order is already paid
    if (targetOrder.paymentStatus === 'PAID') {
      res.status(400).json({ error: 'This order has already been paid.' });
      return;
    }

    const method: PaymentMethod = paymentMethod || 'card';

    // Initialize payment with provider
    const payment = await paymentGateway.initializePaymentSession(
      targetOrder,
      { id: user.id, name: user.name, email: user.email },
      method
    );

    res.status(201).json({
      message: 'Checkout session initialized.',
      payment,
      order: targetOrder
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to initialize checkout session.' });
  }
});

// POST /api/checkout/confirm - Confirm and process real payment
checkoutRouter.post('/confirm', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { paymentId, paymentMethod, cardDetails, paymentToken } = req.body;

    if (!paymentId) {
      res.status(400).json({ error: 'paymentId is required.' });
      return;
    }

    const payment = paymentDb.getById(paymentId);
    if (!payment) {
      res.status(404).json({ error: 'Payment record not found.' });
      return;
    }

    // Security check: only payer or staff can confirm
    if (user.role !== 'admin' && user.role !== 'manager' && payment.customerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: Unauthorized payment confirmation attempt.' });
      return;
    }

    const order = orderDb.findById(payment.orderId);
    if (!order) {
      res.status(404).json({ error: 'Associated order not found.' });
      return;
    }

    // Prevent duplicate payments
    if (order.paymentStatus === 'PAID') {
      res.status(400).json({ error: 'Order is already paid.' });
      return;
    }

    // Process payment through payment provider gateway
    const result = await paymentGateway.processPayment(paymentId, {
      paymentMethod: paymentMethod || payment.paymentMethod,
      cardDetails,
      paymentToken
    });

    if (!result.success) {
      // Publish canonical PAYMENT_FAILED event (dispatches in-app notification and audit log)
      eventBus.publishEvent({
        eventType: 'PAYMENT_FAILED',
        actorUserId: user.id,
        referenceType: 'PAYMENT',
        referenceId: payment.id,
        payload: {
          paymentId: payment.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          amount: payment.amount,
          currency: payment.currency,
          provider: payment.provider,
          failureCode: result.error || 'PAYMENT_DECLINED',
          failedAt: new Date().toISOString()
        }
      }).catch(err => console.error('[Checkout] Failed to publish PAYMENT_FAILED event:', err));

      res.status(402).json({
        error: result.error || 'Payment processing failed.',
        payment: result.payment
      });
      return;
    }

    // Upon verified success, update order payment status to PAID
    const updatedOrder = orderDb.markOrderPaid({
      orderId: order.id,
      paymentId: result.payment.id,
      provider: result.payment.provider,
      providerPaymentId: result.payment.providerPaymentId
    });

    // Publish canonical PAYMENT_SUCCESSFUL event (dispatches in-app notification, transactional email, audit log)
    eventBus.publishEvent({
      eventType: 'PAYMENT_SUCCESSFUL',
      actorUserId: user.id,
      referenceType: 'PAYMENT',
      referenceId: result.payment.id,
      payload: {
        paymentId: result.payment.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        amount: result.payment.amount,
        currency: result.payment.currency,
        provider: result.payment.provider,
        providerPaymentId: result.payment.providerPaymentId || `pay_${result.payment.id}`,
        paidAt: result.payment.updatedAt || new Date().toISOString()
      }
    }).catch(err => console.error('[Checkout] Failed to publish PAYMENT_SUCCESSFUL event:', err));

    res.json({
      message: 'Payment confirmed successfully.',
      payment: result.payment,
      order: updatedOrder
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment confirmation failed.' });
  }
});

// GET /api/checkout/payment/:id - Get authenticated payment details
checkoutRouter.get('/payment/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user!;
    const payment = paymentDb.getById(req.params.id);

    if (!payment) {
      res.status(404).json({ error: 'Payment not found.' });
      return;
    }

    if (user.role !== 'admin' && user.role !== 'manager' && payment.customerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You do not have access to this payment.' });
      return;
    }

    const order = orderDb.findById(payment.orderId);

    res.json({ payment, order });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch payment details.' });
  }
});

// POST /api/checkout/webhook - Cryptographically signed, idempotent payment provider webhook
checkoutRouter.post('/webhook', (req: Request, res: Response): void => {
  try {
    const signature = req.headers['x-webcraft-signature'] as string || req.headers['stripe-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = paymentGateway.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid webhook signature.' });
      return;
    }

    const { eventType, providerPaymentId, orderId, failureReason } = req.body;

    if (!providerPaymentId || !eventType) {
      res.status(400).json({ error: 'Missing required webhook event fields.' });
      return;
    }

    const payment = paymentDb.getByProviderPaymentId(providerPaymentId);
    if (!payment) {
      res.status(404).json({ error: `Payment for provider ID ${providerPaymentId} not found.` });
      return;
    }

    // Idempotent processing
    if (eventType === 'payment_intent.succeeded') {
      if (payment.status !== 'PAID') {
        paymentDb.updateStatus(payment.id, 'PAID', { receiptUrl: `/receipts/${payment.id}` });
        if (orderId) {
          orderDb.markOrderPaid({
            orderId,
            paymentId: payment.id,
            provider: payment.provider,
            providerPaymentId
          });
        }

        const order = orderDb.findById(payment.orderId);
        eventBus.publishEvent({
          eventType: 'PAYMENT_SUCCESSFUL',
          actorUserId: 'WEBHOOK',
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          payload: {
            paymentId: payment.id,
            orderId: payment.orderId,
            orderNumber: order?.orderNumber || `ORD-${payment.orderId.slice(0, 8)}`,
            customerId: payment.customerId,
            amount: payment.amount,
            currency: payment.currency,
            provider: payment.provider,
            providerPaymentId,
            paidAt: new Date().toISOString()
          }
        }).catch(err => console.error('[Webhook] Failed to publish PAYMENT_SUCCESSFUL event:', err));
      }
    } else if (eventType === 'payment_intent.payment_failed') {
      if (payment.status !== 'FAILED') {
        paymentDb.updateStatus(payment.id, 'FAILED', { failureReason: failureReason || 'Provider declined charge.' });
        const order = orderDb.findById(payment.orderId);
        eventBus.publishEvent({
          eventType: 'PAYMENT_FAILED',
          actorUserId: 'WEBHOOK',
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          payload: {
            paymentId: payment.id,
            orderId: payment.orderId,
            orderNumber: order?.orderNumber || `ORD-${payment.orderId.slice(0, 8)}`,
            customerId: payment.customerId,
            amount: payment.amount,
            currency: payment.currency,
            provider: payment.provider,
            failureCode: failureReason || 'PROVIDER_DECLINED',
            failedAt: new Date().toISOString()
          }
        }).catch(err => console.error('[Webhook] Failed to publish PAYMENT_FAILED event:', err));
      }
    } else if (eventType === 'charge.refunded') {
      if (payment.status !== 'REFUNDED') {
        paymentDb.updateStatus(payment.id, 'REFUNDED');
        const order = orderDb.findById(payment.orderId);
        if (order) {
          order.paymentStatus = 'UNPAID';
          orderDb.save();
        }

        eventBus.publishEvent({
          eventType: 'PAYMENT_REFUNDED',
          actorUserId: 'WEBHOOK',
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          payload: {
            paymentId: payment.id,
            orderId: payment.orderId,
            orderNumber: order?.orderNumber || `ORD-${payment.orderId.slice(0, 8)}`,
            customerId: payment.customerId,
            amount: payment.amount,
            currency: payment.currency,
            refundId: `ref_${Date.now()}`,
            refundedAt: new Date().toISOString()
          }
        }).catch(err => console.error('[Webhook] Failed to publish PAYMENT_REFUNDED event:', err));
      }
    }

    res.json({ received: true, eventType, providerPaymentId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Webhook processing failed.' });
  }
});
