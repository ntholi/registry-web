import { UserPosition, UserRole, users } from '@/db/schema';
import { vi } from 'vitest';

type User = typeof users.$inferInsert;

let mockedUser: User = {
  id: 'test-user',
  role: 'user',
  email: 'test@example.com',
};

export const setMockUser = (user: User) => {
  mockedUser = user;
};

export const resetMockUser = () => {
  mockedUser = {
    id: 'test-user',
    role: 'user',
    email: 'test@example.com',
  };
};

export const auth = vi.fn(() => Promise.resolve({ user: mockedUser }));
