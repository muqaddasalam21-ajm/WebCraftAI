import { StatItem } from '../types';

export const mockDashboardStats: StatItem[] = [
  {
    title: 'Total Sales',
    value: '$24,580',
    change: '+14.2% from last month',
    isPositive: true,
    icon: 'DollarSign'
  },
  {
    title: 'Orders',
    value: '124',
    change: '+8.1% from last month',
    isPositive: true,
    icon: 'ShoppingBag'
  },
  {
    title: 'Products',
    value: '86',
    change: '+5 new items added',
    isPositive: true,
    icon: 'Package'
  },
  {
    title: 'Customers',
    value: '342',
    change: '+18.7% growth',
    isPositive: true,
    icon: 'Users'
  }
];
