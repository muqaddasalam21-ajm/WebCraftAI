import { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'USR-01',
    name: 'Muqaddas Alam',
    email: 'muqaddasalam21@gmail.com',
    role: 'Admin',
    status: 'Active',
    joinedDate: '2026-01-10',
    ordersCount: 42
  },
  {
    id: 'USR-02',
    name: 'Elena Rostova',
    email: 'elena.rostova@webcraft.ai',
    role: 'Manager',
    status: 'Active',
    joinedDate: '2026-02-15',
    ordersCount: 88
  },
  {
    id: 'USR-03',
    name: 'Alex Rivera',
    email: 'alex.rivera@webcraft.ai',
    role: 'User',
    status: 'Active',
    joinedDate: '2026-03-01',
    ordersCount: 15
  },
  {
    id: 'USR-04',
    name: 'Botanica Cosmetics Co.',
    email: 'partners@botanica.com',
    role: 'Vendor',
    status: 'Active',
    joinedDate: '2026-04-12',
    ordersCount: 140
  },
  {
    id: 'USR-05',
    name: 'Liam Sterling',
    email: 'liam.s@nordiccraft.dk',
    role: 'Vendor',
    status: 'Pending',
    joinedDate: '2026-08-20',
    ordersCount: 4
  },
  {
    id: 'USR-06',
    name: 'Sophia Wu',
    email: 'sophia.wu@nexusventures.sg',
    role: 'User',
    status: 'Inactive',
    joinedDate: '2026-05-18',
    ordersCount: 2
  }
];
