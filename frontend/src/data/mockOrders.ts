import { Order } from '../types';

export const mockOrders: Order[] = [
  {
    id: 'ORD-9021',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@example.com',
    productName: 'Lumière Radiance Serum (50ml)',
    assignedUser: 'Alex Rivera (Staff)',
    amount: 96.00,
    status: 'Completed',
    date: '2026-09-07',
    paymentStatus: 'Paid'
  },
  {
    id: 'ORD-9020',
    customerName: 'Marcus Vance',
    customerEmail: 'm.vance@techcorp.io',
    productName: 'Freja Ergonomic Oak Chair',
    assignedUser: 'Elena Rostova (Manager)',
    amount: 840.00,
    status: 'Processing',
    date: '2026-09-07',
    paymentStatus: 'Paid'
  },
  {
    id: 'ORD-9019',
    customerName: 'David Chen',
    customerEmail: 'david.chen@designlab.co',
    productName: 'Nexus AI Agency Template License',
    assignedUser: 'David Miller (Admin)',
    amount: 69.00,
    status: 'Completed',
    date: '2026-09-06',
    paymentStatus: 'Paid'
  },
  {
    id: 'ORD-9018',
    customerName: 'Amara Okafor',
    customerEmail: 'amara.o@lifestyle.ng',
    productName: 'Velour Heavyweight Oversized Hoodie',
    assignedUser: 'Alex Rivera (Staff)',
    amount: 220.00,
    status: 'Pending',
    date: '2026-09-06',
    paymentStatus: 'Paid'
  },
  {
    id: 'ORD-9017',
    customerName: 'Lucas Bennett',
    customerEmail: 'lucas.b@horizon.ca',
    productName: 'Atelier Seasonal Tasting Menu Voucher',
    assignedUser: 'Elena Rostova (Manager)',
    amount: 370.00,
    status: 'Completed',
    date: '2026-09-05',
    paymentStatus: 'Paid'
  },
  {
    id: 'ORD-9016',
    customerName: 'Claire Dubois',
    customerEmail: 'claire.d@parisinspire.fr',
    productName: 'Saddle Leather Minimalist Desk Pad',
    assignedUser: 'Alex Rivera (Staff)',
    amount: 75.00,
    status: 'Cancelled',
    date: '2026-09-04',
    paymentStatus: 'Refunded'
  }
];
