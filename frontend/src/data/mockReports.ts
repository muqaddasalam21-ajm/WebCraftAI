import { SalesReportMonth } from '../types';

export const mockMonthlyReports: SalesReportMonth[] = [
  { month: 'Jan', sales: 12400, orders: 65, profit: 9200, loss: 450 },
  { month: 'Feb', sales: 14800, orders: 74, profit: 11200, loss: 520 },
  { month: 'Mar', sales: 18200, orders: 92, profit: 14100, loss: 380 },
  { month: 'Apr', sales: 16900, orders: 86, profit: 12800, loss: 610 },
  { month: 'May', sales: 21500, orders: 110, profit: 17400, loss: 490 },
  { month: 'Jun', sales: 24580, orders: 124, profit: 19800, loss: 320 }
];

export const mockReportSummary = {
  totalRevenue: '$108,380',
  netProfit: '$84,500',
  totalLoss: '$2,770',
  totalOrders: '551',
  avgOrderValue: '$196.69',
  profitMargin: '78.0%'
};
