import { vi } from 'vitest';

let mockedUser: any = {
  id: 'test-user',
  role: 'user',
  email: 'test@example.com',
};

export const setMockUser = (user: any) => {
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
